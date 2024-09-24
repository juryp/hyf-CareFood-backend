# Express and MySQL Template

This project template facilitates the development of web applications using Express.js and MySQL. It includes user authentication via cookies and provides a foundation for building APIs to manage recipes or similar entities.

## Getting started

- Clone project locally:

```
git clone https://github.com/juryp/hyf-CareFood-backend.git
```

nodejs 20.x version required

- Locally run:

    npm i

    npm run dev

This should get you a server running on port 5000. To test, open your browser and go to:

    http://localhost:5000/recipes

You should see a list of recipes.

## Introduction

This template is designed to help developers create a robust web application backend using Express.js and MySQL. It focuses on user registration, authentication, and authorization, allowing authenticated users to manage recipes (or similar entities) through defined APIs.

## Description

- Implement various APIs using Express.js (e.g., Recipes).
- Support user registration and login functionality.
- Non-authenticated users can view all recipes but cannot modify them.
- Authenticated users can perform CRUD (Create, Read, Update, Delete) operations on recipes.

## Project Structure

```plaintext
Project/
├── config
│   ├── db.js           # Database configuration
|-- controllers/
|   ├── userController.js       # Handles user-related operations
|
|-- middleware/
|   ├── verifyToken.js   # Middleware to verify user authentication
|-- models/
|   ├── user.js          # Defines user schema for MySQL
|-- routes/
├── routes
│   ├── boxes.js    # Routes for boxes manipulations
│   ├── offers.js   # Routes for offers operations
│   ├── recipe.js
│   ├── reservations.js # Routes for Reserv and issue and history
│   └── user.js   # Routes for auth and login
|
|-- utils/
|   ├── hashPassword.js      # Utility to hash user passwords
|   ├── matchPasswords.js    # Utility to compare passwords
|   ├── validateEmail.js     # Utility to validate email format
|   ├── validatePasswords.js # Utility to validate password complexity
|-- .babelrc          # Babel configuration for ES6 support
|-- .env              # Environment variables configuration
|-- index.js          # Entry point of the application
|-- package.json      # Dependencies and scripts
|-- README.md         # This file
```

## Setup Instructions

1. **Install dependencies:**

nodejs 20.x version required

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   - Create a `.env` file in the root directory and add the following:

     ```plaintext
     DB_HOST=your_database_host
     DB_USER=your_database_user
     DB_PASSWORD=your_database_password
     DB_NAME=your_database_name
     SECRET_KEY=your_secret_key
     ```

4. **Create a database:**

  ```sql
    CREATE DATABASE carefood;
  ```

Create users table

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    password VARCHAR(100) NOT NULL,
    preferences VARCHAR(20)
  );
```

Create providers table

```sql
CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(255) NOT NULL,
    coordinates VARCHAR(100),
    description TEXT
);
```

Create boxes table:

```sql
CREATE TABLE boxes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT,
    type VARCHAR(20),
    description TEXT,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

Create weekly plans table:

```sql
CREATE TABLE weekly_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT,
    week_start DATE,
    standard_quantity INT,
    vegan_quantity INT,
    diabetic_quantity INT,
    pickup_time TIME,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

Create reservations table:

```sql
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    box_id INT,
    provider_id INT,
    reservation_date DATE,
    quantity INT,
    status ENUM('active', 'issued', 'ready') DEFAULT 'active',
    issued_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (box_id) REFERENCES boxes(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

[Back to top](#project-structure)

5. **Run the application:**

   ```bash
   npm run dev
   ```

## Environment Variables

Ensure the following environment variables are set in your `.env` file:

```plaintext
PORT=5002
TOKEN_ACCESS_SECRET=your_token_secret
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
```

## Routes

### User Routes

**POST /auth/register**

- Registers a new user.
  
  Method POST
  
  URL:

  ```
  http://localhost:5000/auth/register/user
  ```

  Body:

  ```json
  {
  "name": "Ilon Mask",
  "email": "imask@example.com",
  "password": "password123"
  }
  ```

  or
 
  ```json
  {
    "login": "johnsm",
    "name": "John Smith",
    "email": "johnsm@example.com",
    "phone": "1234567890",
    "password": "password123",
    "preferences": "Standard"
    }
  ```
  
  Response:

  ```json
  {
    "message": "User jury created successfully",
    "id": 1,
    "role": "user",
    "login": "johnsm"
  }

- Registers a new provider.

  Method POST
  
  URL:

  ```
  http://localhost:5000/auth/register/provider
  ```

  Body:
    ```json
    {
    "name": "Supermarket",
    "email": "contactsm@supermarket.com",
    "phone": "9876543210", //not mandatory
    "password": "providerpass",
    "address": "123 Main Street",
    "coordinates": "50.1234, 10.5678", //not mandatory
    "description": "The best Food Provider" //not mandatory
    }
    ```

    ```json
    {
    "name": "Supermarket",
    "login": "supermarket_login", //not mandatory
    "email": "contact@supermarket.com",
    "phone": "9876543210", //not mandatory
    "password": "providerpass",
    "address": "123 Main Street",
    "coordinates": "50.1234, 10.5678", //not mandatory
    "description": "Food Provider" //not mandatory
    }
    ```

  Response:

  ```json
  {
    "message": "Provider logged in successfully",
    "id": 3,
    "role": "provider",
    "login": "supermarket_login"
  }
  ```

  **POST /auth/login**

- Logs in an existing user/provider.

  ```
  http://localhost:5000/auth/login
  ```

  Body:

  ```json
  {
    "login": "supermarket_login", 
    "password": "providerpass"
  }
  ```

  Respons if successfully:

  ```json
  {
    "message": "Provider logged in successfully",
    "id": 3,
    "role": "provider",
    "login": "supermarket_login"
  }
  ```

  Respons else:

  ```json
  {
    "message": "Invalid login or password"
  }
  ```

- **POST /logout**
  - Logout user.

  ### Offers Routes

  **GET /offers**

  Method GET

  ```
  http://localhost:5000/offers?startDate=2024-09-14&endDate=2024-09-14
  ```

  Response:

  ```json
  [
    {
        "provider_id": 1,
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles",
        "date": "2024-09-14",
        "standard_unit": 18,
        "vegan_unit": 15,
        "diabetic_unit": 0,
        "pickup_time": "17:30:00",
        "standard_description": "Includes meat or fish products, frozen or fresh, mushrooms, vegetables, fruits, pasta, sauces.",
        "vegan_description": "Includes only plant-based items: vegetables, fruits, grains, pasta, sauces.",
        "diabetic_description": "Includes diabetic-friendly items: whole grains, vegetables, low-sugar products."
    },
    {
        "provider_id": 2,
        "provider_name": "Lidl40Cote",
        "address": "Rue des Coteaux 40, 1030 Schaerbeek",
        "date": "2024-09-14",
        "standard_unit": 1,
        "vegan_unit": 4,
        "diabetic_unit": 2,
        "pickup_time": "17:30:00",
        "standard_description": "Includes meat or fish products, frozen or fresh, mushrooms, vegetables, fruits, pasta, sauces.",
        "vegan_description": "Includes only plant-based items: vegetables, fruits, grains, pasta, sauces.",
        "diabetic_description": "Includes diabetic-friendly items: whole grains, vegetables, low-sugar products."
    },
    {
        "provider_id": 3,
        "provider_name": "AldiWest",
        "address": "Rue de Intendant 53, 1080 Molenbeek-Saint-Jean",
        "date": "2024-09-14",
        "standard_unit": 1,
        "vegan_unit": 4,
        "diabetic_unit": 0,
        "pickup_time": "17:30:00",
        "standard_description": "Includes meat or fish products, frozen or fresh, mushrooms, vegetables, fruits, pasta, sauces.",
        "vegan_description": "Includes only plant-based items: vegetables, fruits, grains, pasta, sauces.",
        "diabetic_description": "Includes diabetic-friendly items: whole grains, vegetables, low-sugar products."
    }
  ]
  ```

  http://localhost:5000/offers?startDate=2024-09-14&endDate=2024-09-14&onlyTotals=true

  Response only total infomations:

  ```json
  {
    "offersNum": 3,
    "offersStandard": 20,
    "offersVegan": 23,
    "offersDiabetic": 2,
    "offersUnit": 45
  }
  ```
  



  ### Reservations Routes

#### Reservation Flow Diagram

This sequence diagram illustrates the interaction between a user, server, and provider during the food box reservation process. The flow covers the stages from viewing available offers, making a reservation, changing the reservation status to "ready," and finally issuing the reserved boxes.


  ```mermaid
  sequenceDiagram
    participant User1
    participant Server
    participant Provider3

    User1->>Server: GET /offers?startDate=2024-09-14&endDate=2024-09-14
    Server-->>User1: Returns available offers

    User1->>Server: POST /reservations with box_id and quantity
    Server-->>User1: Reservation created with status "active"

    User1->>Server: GET /reservations/user/1?date=2024-09-14
    Server-->>User1: Shows reservation with status "active"

    Provider3->>Server: GET /reservations/provider/3?startDate=2024-09-14&endDate=2024-09-14
    Server-->>Provider3: Shows reservations including user's reservation

    Provider3->>Server: POST /reservations/ready/user with user_id and date
    Server-->>Provider3: Marks reservation as "ready"

    User1->>Server: GET /reservations/user/1?date=2024-09-14
    Server-->>User1: Shows reservation with status "ready"

    Provider3->>Server: POST /reservations/issue/4
    Server-->>Provider3: Marks reservation as "issued"

    User1->>Server: GET /reservations/user/1/history?startDate=2024-09-14&endDate=2024-09-14
    Server-->>User1: Shows reservation with status "issued"
  ```

- **POST /reservations**

- Make Reservation for User #9 (authenticated users only).

  Method POST:

  ```
  http://localhost:5000/reservations/
  ```

  Body:

  ```json
  {
  "user_id": 9,
  "date": "2024-09-14",
  "provider_id": 1,
  "box_id": 1,
  "quantity": 2
  }
  ```

  Response if successfully:

  ```json
  {
    "message": "Reservation successfully created"
  }
  ```

  Response if not enough boxes:

  ```json
  {
    "message": "Not enough boxes available for reservation"
  }
  ```

  Show Reserved Boxes by User #9:

  Method GET:

  ```
  http://localhost:5000/reservations/user/9?date=2024-09-14
  ```

  Response:

  ```json
  [
    {
        "id": 4,
        "reservation_date": "2024-09-14T00:00:00.000Z",
        "quantity": 1,
        "status": "active",
        "type": "Standard",
        "provider_name": "AldiWest",
        "address": "Rue de Intendant 53, 1080 Molenbeek-Saint-Jean"
    },
    {
        "id": 9,
        "reservation_date": "2024-09-14T00:00:00.000Z",
        "quantity": 4,
        "status": "active",
        "type": "Standard",
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles"
    }
  ]
  ```

  Show Reserved Boxes in Shop 1

  Method POST:

  ```
  http://localhost:5000/reservations/provider/1?startDate=2024-09-14&endDate=2024-09-14
  ```

  Response:

  ```json
  [
    {
        "id": 18,
        "reservation_date": "2024-09-14",
        "quantity": 1,
        "status": "active",
        "type": "Standard",
        "user_name": "John Doe",
        "email": "john.doe@example.com"
    },
    {
        "id": 19,
        "reservation_date": "2024-09-14",
        "quantity": 2,
        "status": "active",
        "type": "Standard",
        "user_name": "Felix Doe",
        "email": "felix.doe@example.com"
    }
  ]
  ```

  Added(change) status of boxes from "Active" to "Ready for issue"

  Ready for all boxes on date
  
  Method POST:
    
  ```
  http://localhost:5000/reservations/ready/all
  ```

  Body:

  ```json
  {
  "provider_id": 1,
  "date": "2024-09-14"
  }
  ```

  Ready all reservations of a specific type for a store on date:

  Method POST

  ```
  http://localhost:5000/reservations/ready/type
  ```

  Body:

  ```json
  {
  "provider_id": 1,
  "box_type": 1,
  "date": "2024-09-18"
  }
  ```

  Ready all reservations for user on date:

  Method POST

  ```
  http://localhost:5000/reservations/ready/user
  ```
  Body:

  ```json
  {
  "provider_id": 1,
  "user_id": 5,
  "date": "2024-09-18" 
  }
  ```

  Issue a Specific Reservation by ID

  Method POST:

  Issue Reservation ID 18

  ```
  http://localhost:5000/reservations/issue/18
  ```

  Response:

  ```json
  {
    "message": "Reservation has been successfully issued"
  }
  ```

  Issue All Reservations for a User on a Specific Date

  Method POST:

  ```
  http://localhost:5000/reservations/issue/all
  ```

  Body:

  ```json
  {
    "provider_id": 1,
    "user_id": 2,
    "date": "2024-09-14"
  }
  ```

  Response:

  ```json
  {
    "message": "All reservations for the user on this date have been issued"
  }
  ```

  **Reservation History**

  For Providers:

  Method GET:

  ```
  http://localhost:5000/reservations/provider/1/history?startDate=2024-09-15&endDate=2024-09-17
  ```

  Respons:

  ```json
  [
    {
        "id": 4,
        "reservation_date": "2024-09-14",
        "quantity": 1,
        "status": "active",
        "type": "Standard",
        "user_name": "John Smith",
        "email": "john@example.com",
        "user_id": 1
    },
    {
       "id": 38,
        "reservation_date": "2024-09-14",
        "quantity": 2,
        "status": "ready",
        "type": "Standard",
        "user_name": "Anna White",
        "email": "anna@example.com",
        "user_id": 2
    }
  ]
  ```

  For Users:

  Method GET:

  ```
  http://localhost:5000/reservations/user/9?startDate=2024-09-16&endDate=2024-09-17
  ```

  Respons:

  ```json
  [
    {
        "id": 9,
        "issued_date": "2024-09-17T00:00:00.000Z",
        "quantity": 4,
        "type": "Standard",
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles"
    },
    {
        "id": 10,
        "issued_date": "2024-09-17T00:00:00.000Z",
        "quantity": 2,
        "type": "Diabetic",
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles"
    },
    {
        "id": 11,
        "issued_date": "2024-09-17T00:00:00.000Z",
        "quantity": 2,
        "type": "Standard",
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles"
    },
    {
        "id": 29,
        "issued_date": "2024-09-17T00:00:00.000Z",
        "quantity": 1,
        "type": "Standard",
        "provider_name": "Lidl138Gray",
        "address": "Rue Gray 138, 1050 Ixelles"
    }
  ]
  ```

  ### Boxes Routes

  Get for provider 3 up-to-date information about the type and description of boxes, and pickup_time

  Method GET

  http://localhost:5000/boxes/get-boxes/3

  Response:
  ```json
  {
    "boxes": [
        {
            "type": "Standard",
            "description": "Includes meat or fish products, frozen or fresh, mushrooms, vegetables, fruits, pasta, sauces."
        },
        {
            "type": "Vegan",
            "description": "Includes only plant-based items: vegetables, fruits, grains, pasta, sauces."
        },
        {
            "type": "Diabetic",
            "description": "Includes diabetic-friendly items: whole grains, vegetables, low-sugar products."
        }
    ],
    "pickup_time": "17:00:00"
  }
  ```


  **PUT /boxes/add-boxes**

  Add 7 Standard Boxes for Provider 3 on 14th Sep

  Method PUT:reservations/user/1/history

  ```
  http://localhost:5000/boxes/add-boxes
  ```

  Body:

  example of the body 1 - no descriptions and pickup_time
  ```json
  {
  "provider_id": 3,
  "date": "2024-09-14",
  "type": 1,
  "quantity": 4
  }
  ```

  example of the body 2 - no descriptions

  ```json
  {
  "provider_id": 3,
  "date": "2024-09-14",
  "type": 3,
  "quantity": 2,
  "pickup_time": "17:30:00"
  }
  ```

  example of the body 3 no pickup_time

  ```json
  {
  "provider_id": 3,
  "date": "2024-09-14",
  "type": 2,
  "quantity": 3,
  "description": "New vegan food option"
  }
  ```


  Response:

  ```json
  {
    "message": "Box quantity updated successfully",
    "pickup_time": "17:00:00"
  }
  ```


### User Controller

Handles user registration, login, and other user-related actions.

### Recipe Controller

Manages CRUD operations for recipes.

## Middleware Functions

### Verify Token

Middleware function to verify user tokens for authentication purposes.

## Utility Functions

### hashPassword.js

Utility to hash user passwords for secure storage.

### matchPasswords.js

Utility to compare password and confirmPassword.

### validateEmail.js

Utility to validate email format.

### validatePasswords.js

Utility to ensure passwords meet required complexity criteria.

## Authentication

- Users must register and log in to perform certain actions.
- Authentication is handled using cookies.
- The `verifyToken` middleware function ensures that only authenticated users can access restricted routes.

## Resources

- [Express Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://www.npmjs.com/package/mysql2)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Cookie Parser Middleware](https://www.npmjs.com/package/cookie-parser)
