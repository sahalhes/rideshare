# Rideshare Web App 🚗

A rideshare web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that allows users to connect with friends and share rides to common destinations. The app supports trip creation, joining trips, and viewing user profiles. It also provides a profile management feature for user accounts.

## Features
- **User Authentication:** Sign up, log in, and manage user accounts.
- **Trip Management:**
  - Create trips and specify details such as date, time, and destination.
  - Search for public trips or trips created by friends.
  - Request to join trips and allow trip leaders to accept or decline requests.
- **Map Integration:**
  - Interactive maps powered by `Mapbox` for route planning and visualization.
- **Profile Customization:**
  - Edit profile information, including usernames and profile pictures.

## Tech Stack
- **Frontend:**
  - React.js with Tailwind CSS for a responsive and modern UI.
- **Backend:**
  - Node.js and Express.js for handling API requests and server-side logic.
- **Database:**
  - MongoDB for storing user data, trip details, and chat messages.
- **Maps and Routes:**
  - Mapbox API for maps and route visualizations.

## Deployment
- **CI/CD:**
  - The app is deployed using GitHub Actions, which automatically builds and pushes backend and frontend Docker images to Docker Hub.
- **AWS EC2 & Load Balancer:**
  - A GitHub Actions runner deploys the app by pulling the images to an AWS EC2 instance. The EC2 instance sits behind an Elastic Load Balancer (ELB) with an SSL certificate applied to ensure secure HTTPS traffic.
- **Cloudflare:**
  - The Elastic Load Balancer is further secured and optimized by Cloudflare, providing additional caching, DDoS protection, and performance enhancements.
