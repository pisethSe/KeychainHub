# How to Create a Register Request in Postman with JSON

This guide explains how to create a user registration request in Postman for the KeychainHub API.

## API Endpoint Information

- **URL**: `http://localhost:9999/api/auth/register`
- **Method**: POST
- **Content-Type**: application/json

## Required Fields

Based on the validation schema, the following fields are required:

1. **name** (string, minimum 2 characters)
2. **email** (valid email format)
3. **password** (string, minimum 6 characters)

Optional fields:

- **phone** (string)
- **address** (string)

## Step-by-Step Instructions

### 1. Set up the Request

1. Open Postman
2. Click on the "+" button to create a new request
3. Set the HTTP method to **POST**
4. Enter the URL: `http://localhost:9999/api/auth/register`

### 2. Configure Headers

1. Go to the **Headers** tab
2. Add a header with:
   - Key: `Content-Type`
   - Value: `application/json`

### 3. Set up the Request Body

1. Go to the **Body** tab
2. Select the **raw** radio button
3. Choose **JSON** from the dropdown menu
4. Enter the following JSON payload:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

### 4. Send the Request

Click the **Send** button to submit the registration request.

## Expected Response

### Successful Registration (201 Created)

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id_here",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "isAdmin": false
    },
    "token": "jwt_token_here"
  }
}
```

### Error Responses

**User Already Exists (400 Bad Request)**

```json
{
  "error": "User already exists with this email"
}
```

**Validation Errors (400 Bad Request)**

```json
{
  "error": "Name must be at least 2 characters"
}
```

## Example JSON Payloads

### Minimal Required Fields

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "securepass"
}
```

### Complete Registration with All Fields

```json
{
  "name": "Robert Johnson",
  "email": "robert.j@example.com",
  "password": "mySecurePassword123",
  "phone": "+1-555-123-4567",
  "address": "456 Oak Avenue, Springfield, IL 62701"
}
```

## Important Notes

1. **Server Port**: Make sure the backend server is running on port 9999. If it's running on a different port, update the URL accordingly.

2. **Email Uniqueness**: Each email can only be registered once. Attempting to register with an existing email will result in an error.

3. **Password Security**: The password is hashed using bcrypt before storing in the database.

4. **JWT Token**: Upon successful registration, a JWT token is returned which can be used for authenticated requests.

5. **Cookie**: The token is also set as an HTTP-only cookie named "jwt" for session management.

## Testing the Registration

1. Ensure your backend server is running (`npm run dev` in the backend directory)
2. Follow the steps above to create and send the registration request
3. Check the response to verify successful registration
4. You can then use the returned token or cookie for authenticated requests to protected endpoints

## Related Endpoints

After registration, you can use these endpoints:

- **Login**: `POST /api/auth/login`
- **Get Profile**: `GET /api/auth/profile` (requires authentication)
- **Update Profile**: `PUT /api/auth/profile` (requires authentication)
- **Logout**: `POST /api/auth/logout`
