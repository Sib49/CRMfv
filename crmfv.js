// Import sqlite3
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQLite database.');
});

// Class Definitions, This is users and customers merged:)
class Entity {
  constructor(entity_id, first_name, last_name, email, phone, address, city, state, zipCode, country, createdAt, username, password, role) {
    this.entity_id = entity_id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.country = country;
    this.createdAt = createdAt;
    this.username = username;
    this.password = password;
    this.role = role;
    this.accounts = [];
    this.contacts = [];
  }

  addAccount(account) {
    this.accounts.push(account);
  }

  addContact(contact) {
    this.contacts.push(contact);
  }
}

class Contact {
  constructor(contact_id, name, email, phone) {
    this.contact_id = contact_id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.entity_id = null;
  }

  associateEntity(entity_id) {
    this.entity_id = entity_id;
  }
}

class Support {
  constructor(entity_id, subject, description, status, createdAt, closedAt) {
    this.entity_id = entity_id;
    this.subject = subject;
    this.description = description;
    this.status = status;
    this.createdAt = createdAt;
    this.closedAt = closedAt;
  }
}

class Order {
  constructor(orderID, entityID, quantity, totalAmount, orderDate, status, createdAt) {
    this.orderID = orderID;
    this.entityID = entityID;
    this.quantity = quantity;
    this.totalAmount = totalAmount;
    this.orderDate = orderDate;
    this.status = status;
    this.createdAt = createdAt;
  }
}

class Interaction {
  constructor(interactionID, entityID, interactionType, interactionDate, notes, createdAt) {
    this.interactionID = interactionID;
    this.entityID = entityID;
    this.interactionType = interactionType;
    this.interactionDate = interactionDate;
    this.notes = notes;
    this.createdAt = createdAt;
  }
}

class AccessLevel {
  constructor(levelID, levelName) {
    this.levelID = levelID;
    this.levelName = levelName;
  }
}

class AccessDefinition {
  constructor(definitionID, levelID, entityType, canRead, canWrite, canDelete) {
    this.definitionID = definitionID;
    this.levelID = levelID;
    this.entityType = entityType;
    this.canRead = canRead;
    this.canWrite = canWrite;
    this.canDelete = canDelete;
  }
}

class EntityAccess {
  constructor(accessID, entityID, levelID) {
    this.accessID = accessID;
    this.entityID = entityID;
    this.levelID = levelID;
  }
}

// SQL Queries to create tables and insert data
db.serialize(() => {
  db.run(`CREATE TABLE Entities (
    EntityID INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    Phone TEXT,
    Address TEXT,
    City TEXT,
    State TEXT,
    ZipCode TEXT,
    Country TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Username TEXT,
    Password TEXT,
    Role TEXT
  )`);

  db.run(`CREATE TABLE Contacts (
    ContactID INTEGER PRIMARY KEY AUTOINCREMENT,
    EntityID INTEGER,
    ContactType TEXT,
    ContactDate DATE,
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(EntityID) REFERENCES Entities(EntityID)
  )`);

  db.run(`CREATE TABLE Deals (
    DealID INTEGER PRIMARY KEY AUTOINCREMENT,
    EntityID INTEGER,
    DealType TEXT,
    DealDate DATE,
    Amount DECIMAL(10, 2),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(EntityID) REFERENCES Entities(EntityID)
  )`);

  db.run(`CREATE TABLE Interactions (
    InteractionID INTEGER PRIMARY KEY AUTOINCREMENT,
    EntityID INTEGER,
    InteractionType TEXT,
    InteractionDate DATE,
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(EntityID) REFERENCES Entities(EntityID)
  )`);

  db.run(`CREATE TABLE AccessLevels (
    LevelID INTEGER PRIMARY KEY AUTOINCREMENT,
    LevelName TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE AccessDefinitions (
    DefinitionID INTEGER PRIMARY KEY AUTOINCREMENT,
    LevelID INTEGER,
    EntityType TEXT,
    CanRead BOOLEAN,
    CanWrite BOOLEAN,
    CanDelete BOOLEAN,
    FOREIGN KEY(LevelID) REFERENCES AccessLevels(LevelID)
  )`);

  db.run(`CREATE TABLE EntityAccess (
    AccessID INTEGER PRIMARY KEY AUTOINCREMENT,
    EntityID INTEGER,
    LevelID INTEGER,
    FOREIGN KEY(EntityID) REFERENCES Entities(EntityID),
    FOREIGN KEY(LevelID) REFERENCES AccessLevels(LevelID)
  )`);

  // Insert data
  let insertEntity = db.prepare(`INSERT INTO Entities (FirstName, LastName, Email, Phone, Address, City, State, ZipCode, Country, Username, Password, Role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertEntity.run('John', 'Doe', 'john.doe@example.com', '1234567890', '123 Main St', 'Anytown', 'Anystate', '12345', 'USA', 'johndoe', 'password123', 'customer');
  insertEntity.finalize();

  let insertAccessLevel = db.prepare(`INSERT INTO AccessLevels (LevelName) VALUES (?)`);
  insertAccessLevel.run('Admin');
  insertAccessLevel.run('User');
  insertAccessLevel.run('Guest');
  insertAccessLevel.finalize();

  let insertAccessDefinition = db.prepare(`INSERT INTO AccessDefinitions (LevelID, EntityType, CanRead, CanWrite, CanDelete) VALUES (?, ?, ?, ?, ?)`);
  insertAccessDefinition.run(1, 'Entity', true, true, true); // Admin/Manager.
  insertAccessDefinition.run(2, 'Entity', true, true, false); // User,Customer.
  insertAccessDefinition.run(3, 'Entity', true, false, false); // Guest.
  insertAccessDefinition.finalize();

  let insertEntityAccess = db.prepare(`INSERT INTO EntityAccess (EntityID, LevelID) VALUES (?, ?)`);
  insertEntityAccess.run(1, 1); // John Doe is Admin
  insertEntityAccess.finalize();

  // Select data
  db.each(`SELECT * FROM Entities`, (err, row) => {
    if (err) {
      throw err;
    }
    console.log(row);
  });
});

// CRUD Functions for Interactions

// Function to create a new interaction
function createInteraction(entityID, interactionType, interactionDate, notes) {
  let query = `INSERT INTO Interactions (EntityID, InteractionType, InteractionDate, Notes) VALUES (?, ?, ?, ?)`;
  db.run(query, [entityID, interactionType, interactionDate, notes], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`A new interaction has been added with InteractionID ${this.lastID}`);
  });
}

// Function to read all interactions
function readInteractions() {
  let query = `SELECT * FROM Interactions`;
  db.all(query, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      console.log(row);
    });
  });
}

// Function to update an interaction's notes
function updateInteractionNotes(interactionID, newNotes) {
  let query = `UPDATE Interactions SET Notes = ? WHERE InteractionID = ?`;
  db.run(query, [newNotes, interactionID], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
  });
}

// Function to delete an interaction
function deleteInteraction(interactionID) {
  let query = `DELETE FROM Interactions WHERE InteractionID = ?`;
  db.run(query, interactionID, function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Row(s) deleted: ${this.changes}`);
  });
}

// Example interactions
createInteraction(1, 'Phone Call', '2024-07-11', 'Discussed project details');
readInteractions();
updateInteractionNotes(1, 'Discussed project details and budget');
deleteInteraction(1);

// Close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Close the database connection.');
});
