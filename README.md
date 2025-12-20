# 🚗 Final-AutoRide

A modern, scalable ride-sharing platform developed using **Node.js**, **Express**, and hosted on **Google Cloud App Engine**.

## 🚀 Key Features

* **Scalable Backend:** Built on the Google Cloud App Engine Standard Environment for automatic scaling and cost efficiency.
* **RESTful API:** Clean and well-organized API endpoints for both riders and drivers.
* **Modern JavaScript:** Utilizes Node.js and the robust Express.js framework for fast development.
* **Deployment Ready:** Includes necessary configurations (`app.yaml`, `cloudbuild.yaml`) for seamless deployment via Google Cloud Build.

## 🛠️ Technology Stack

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Backend** | Node.js | Runtime environment for the application. |
| **Framework** | Express.js | API routing and middleware management. |
| **Hosting** | Google Cloud App Engine | Production environment with auto-scaling capabilities. |
| **Deployment** | Google Cloud Build | CI/CD pipeline and automated build process. |

## ⚙️ Local Setup

Follow these steps to get the project running on your local machine:

### Prerequisites

Ensure you have the following software installed:

* Node.js (v18 or higher)
* npm (Node Package Manager)
* Git

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/anik999xc/Final-AutoRide.git](https://github.com/anik999xc/Final-AutoRide.git)
    cd Final-AutoRide
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the project root folder to store sensitive information (e.g., database connection strings, API keys).

    **.env (Example)**
    ```
    PORT=8080
    DB_URI=mongodb://localhost:27017/autoride_db
    ```

4.  **Start the Application:**
    ```bash
    npm start
    # or
    # node server.js
    ```

The application should now be accessible at `http://localhost:8080` (or the PORT you configured).

## ☁️ Google Cloud Deployment

This project is configured for the Google Cloud App Engine Standard Environment.

### Deployment Steps

1.  **Install Google Cloud SDK:** Make sure the `gcloud` CLI is installed on your system.
2.  **Authenticate:** Log in to your Google Cloud account and set your project ID:
    ```bash
    gcloud auth login
    gcloud config set project [YOUR_PROJECT_ID]
    ```
3.  **Deploy to App Engine:**
    Use the following command to deploy using the provided `app.yaml` and `cloudbuild.yaml` configurations:
    ```bash
    gcloud app deploy
    ```
    This command will automatically initiate the build and deployment process.

## 🤝 Contribution

We welcome contributions! Please feel free to submit ideas, bug fixes, or new features via a Pull Request.

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

Distributed under the MIT License. See the `LICENSE` file for more information.