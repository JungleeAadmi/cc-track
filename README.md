# **CC-Track**

A personal finance, lending, and subscription tracker.  
**Privacy-first | Self-hosted | Mobile-first**

## **📂 Folder Structure**

* **backend/**: FastAPI application (Python) \+ SQLite DB  
* **frontend/**: React \+ Vite application  
* **install.sh**: One-shot installation script  
* **update.sh**: Full system and app update script

## **🚀 Installation (The Easy Way)**

Run this single command on your fresh Ubuntu/Debian LXC or VM.  
It will update your system, install dependencies, clone the repo, setup security keys, and launch the app.  
```
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/install.sh)"
```


Once finished, access the app at: http://\<your-server-ip\>

## **🔄 Updating the App & System**


```
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/update.sh)"
```

To update the app code AND your system packages (apt upgrade) in one go:

1. SSH into your server and go to the folder (usually \~/cc-track).  
2. Run the update script:

cd \~/cc-track  
sudo ./update.sh

**What the update script does:**

1. Runs apt-get update && apt-get upgrade \-y (System Security).  
2. Pulls latest code from GitHub.  
3. Updates Python requirements.  
4. Rebuilds React Frontend.  
5. Restarts the Backend Service.  
6. **KEEPS** your database (cc\_track.db) and uploads intact.

## **🛠 Manual Dev Run**

**Backend:**  
cd backend  
python \-m venv venv  
source venv/bin/activate  
uvicorn app.main:app \--reload

**Frontend:**  
cd frontend  
npm install  
npm run dev  
