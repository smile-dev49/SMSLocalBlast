# SMS LocalBlast Excel Add-in

Office.js task pane for sending bulk SMS from Excel.

## Sideload in Excel

1. **Start the API server** (serves the add-in at `http://localhost:3000/add-in/`):
   ```bash
   cd server && npm run dev
   ```

2. **Share the manifest**  
   Copy the `excel-addin` folder to a network share or a folder Excel can access (e.g. `C:\SMS-LocalBlast-Addin`).

3. **Add the add-in in Excel**:
   - Excel: **Insert** → **Get Add-ins** → **My Add-ins** → **Shared Folder**
   - Browse to the folder containing `manifest.xml` and select it
   - Or: **File** → **Options** → **Trust Center** → **Trust Center Settings** → **Trusted Add-in Catalogs** → add the folder path

4. **Open the task pane**  
   Insert → My Add-ins → SMS LocalBlast (or from the add-in list).

5. **Use the add-in**  
   - Sign in with your API email/password  
   - Put **Phone** in column A and **Message** in column B (header row optional)  
   - Click **Enqueue messages**

## Sheet format

| A (Phone)   | B (Message)     |
|-------------|-----------------|
| +1555123456 | Hello!          |
| +1555987654 | Hi {{Name}}     |

The add-in sends each row to `POST /api/messages` (pending queue). Your mobile gateway picks them up via `claim-next`.
