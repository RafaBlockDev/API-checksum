### Endpoints

#### Get Latest Blocks

Returns information about the latest blocks.

- **URL**: `/api/blocks/latest-blocks`
- **Method**: `GET`
- **URL Params**: 
  - `numberOfBlocks=[integer]` (optional): Number of latest blocks to retrieve. Default is 5.

- **Success Response**:
  - **Code**: 200
  - **Content**: 
    ```json
    [
      {
        "block": 123456,
        "timestamp": 1620000000000,
        "header": "0x...",
        "size": 1234
      },
      ...
    ]
    ```

- **Error Response**:
  - **Code**: 500 INTERNAL SERVER ERROR
  - **Content**: `{ error: "error message" }`

#### Get Last N Transactions

Returns the last N transactions from the latest blocks.

- **URL**: `/api/blocks/latest-transactions`
- **Method**: `GET`
- **URL Params**: 
  - `n=[integer]` (optional): Number of transactions to retrieve. Default is 10.
  - `numberOfBlocks=[integer]` (optional): Number of latest blocks to search for transactions. Default is 5.

- **Success Response**:
  - **Code**: 200
  - **Content**: 
    ```json
    [
      {
        "hash": "0x...",
        "blockNumber": 123456,
        "timestamp": 1620000000000,
        "from": "0x...",
        "to": "0x..."
      },
      ...
    ]
    ```

- **Error Response**:
  - **Code**: 500 INTERNAL SERVER ERROR
  - **Content**: `{ error: "error message" }`

