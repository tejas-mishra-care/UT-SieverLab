
# UltraTech Sieve Test Master: Advanced Sieve Analysis Calculator

## Project Overview

UltraTech Sieve Test Master is a modern, web-based application designed for civil engineers, lab technicians, and construction professionals to perform and analyze aggregate sieve analysis data with precision and efficiency. The application automates the complex calculations required by Indian Standard **IS 383:2016**, providing instant results, interactive visualizations, and professional-grade PDF reports.

The primary goal of UltraTech Sieve Test Master is to replace cumbersome manual calculations and spreadsheets with an intuitive, fast, and standard-compliant digital tool, reducing errors and saving valuable time.

---

## Key Features

### 1. Multi-Aggregate Analysis
The application supports comprehensive analysis for different types of aggregates, adhering to IS 383 specifications.
- **Fine Aggregate Analysis:**
    - Calculates Fineness Modulus.
    - Automatically classifies the aggregate into **Grading Zones I, II, III, or IV**.
    - Displays an interactive grading curve with official IS 383 zone limits for easy comparison.
- **Coarse Aggregate Analysis:**
    - **Graded Aggregate:** Performs analysis for graded coarse aggregates (e.g., 20mm nominal size).
    - **Single Size Aggregate:** Allows for individual analysis of single-sized aggregates, with dedicated forms for **20mm** and **10mm** nominal sizes.

### 2. Interactive Combined Gradation
This is the core feature for mix design, allowing users to virtually blend aggregates and visualize the result.
- **Flexible Blending:** Users can combine the calculated fine aggregate with any of the calculated coarse aggregate types (Graded, 10mm, or 20mm).
- **Live Proportions:** An interactive slider allows users to adjust the percentage of fine and coarse aggregate in the mix, with the chart updating in real-time.
- **Specification Conformance:** The combined gradation curve is plotted against the standard IS 383 limits for 20mm nominal size graded aggregate.
- **Visual Feedback:** Data points on the combined curve that fall **outside the specification limits** are automatically highlighted in red, providing immediate visual feedback on the mix quality.

### 3. Rich Data Visualization
Interactive charts provide a clear and intuitive understanding of the aggregate properties.
- **Logarithmic Scale Charts:** All grading curves are plotted on a logarithmic x-axis for sieve sizes, as is standard practice.
- **Dynamic Tooltips:** Hovering over chart points reveals detailed information about `% Passing`, sieve size, and specification limits.
- **Clear Legends:** Charts include clear legends for `% Passing`, specification limits, and different grading zones.

### 4. Professional PDF Reporting
Generate detailed, shareable PDF reports with a single click.
- **Comprehensive Summary:** Reports include the test name, date, and detailed tables for input weights and calculated results (% Retained, Cumulative % Retained, % Passing).
- **Visuals Included:** The generated grading curve charts for each analysis are embedded directly into the PDF.
- **Client-Side Generation:** PDF generation is handled instantly in the browser using `jsPDF` for a fast user experience.

### 5. User Account Management
Secure and personalized experience for every user.
- **Authentication:** Users can sign up and log in using Email/Password or Google Sign-In, powered by Firebase Authentication.
- **Profile Management:** Users can view and update their profile information, including their name.

---

## Technology Stack

### Frontend
- **Framework:** **Next.js 15** (App Router)
- **Language:** **TypeScript**
- **UI Library:** **React**
- **UI Components:** **ShadCN/UI** - A collection of beautifully designed, accessible components.
- **Styling:** **Tailwind CSS** for a utility-first styling approach.
- **Charting:** **Recharts** for creating interactive and responsive charts.
- **Form Management:** **React Hook Form** with **Zod** for robust and type-safe form validation.

### Backend & Database
- **Authentication:** **Firebase Authentication** for secure user management.
- **Database:** **Firestore** for storing user profile data. The database is structured for scalability and security, with rules protecting user data.

### Tooling
- **PDF Generation:** **jsPDF** and **jspdf-autotable** for creating professional PDF reports on the client-side.
- **Deployment:** Ready for deployment on services like Firebase App Hosting or Vercel.
