# UltraTech Sieve Test Master: Advanced Sieve Analysis Calculator

## 1. Project Overview

**UltraTech Sieve Test Master** is a specialized, web-based application engineered for civil engineers, lab technicians, and construction professionals. It provides a precise and efficient platform for performing and analyzing aggregate sieve analysis data. The application automates the complex calculations mandated by the Indian Standard **IS 383:2016**, delivering instant results, interactive data visualizations, and professional-grade PDF reports.

The primary mission of this tool is to replace cumbersome manual calculations and error-prone spreadsheets with an intuitive, rapid, and standard-compliant digital solution. This shift significantly reduces the potential for human error and saves valuable time in quality control and mix design processes.

---

## 2. Core Features

### 2.1. Multi-Aggregate Analysis
The application supports comprehensive analysis for different types of aggregates, strictly adhering to IS 383 specifications.

-   **Fine Aggregate Analysis:**
    -   Calculates the **Fineness Modulus**, a key index of aggregate fineness.
    -   Automatically classifies the aggregate into one of four **Grading Zones (I, II, III, or IV)** based on the 600-micron sieve's `% Passing` value.
    -   If the sample does not perfectly conform to any single zone, it identifies the *best-fit zone* and provides a verification table highlighting the specific deviations.
    -   Displays an interactive grading curve plotted against the official IS 383 zone limits for easy visual comparison.

-   **Coarse Aggregate Analysis:**
    -   **Graded Aggregate:** Performs analysis for graded coarse aggregates (e.g., 20mm nominal size).
    -   **Single-Sized Aggregate:** Allows for individual analysis of single-sized aggregates, with dedicated forms for both **20mm** and **10mm** nominal sizes.

### 2.2. Interactive Combined Gradation & Blend Optimization
This is the application's core feature for mix design, allowing users to virtually blend aggregates and visualize the result in real-time.

-   **Two Blend Modes:**
    1.  **Two-Material Blend:** For combining Fine Aggregate with one type of Coarse Aggregate (Graded, 20mm Single, or 10mm Single).
    2.  **Three-Material Blend:** A powerful feature for blending Fine Aggregate with **both 20mm and 10mm** single-sized aggregates. This mode is automatically enabled when results for all three materials are available.

-   **Live Proportion Adjustment:** Interactive sliders allow users to adjust the percentage of each aggregate in the mix. The combined gradation chart updates instantly to reflect these changes.

-   **Blend Recommendation Engine:**
    -   A "Recommend Blend" button triggers a powerful optimization algorithm.
    -   For both two- and three-material blends, the engine iterates through thousands of combinations to find the optimal percentages that bring the combined gradation curve as close as possible to the ideal midpoint of the **IS 383 specification for 20mm nominal size graded aggregate**.
    -   This provides an excellent starting point for a compliant and well-graded mix design.

-   **Specification Conformance & Visual Feedback:**
    -   The combined gradation curve is plotted against the standard IS 383 limits.
    -   Data points on the curve that fall **outside the specification limits** are automatically highlighted in **red**, providing immediate visual feedback on the mix quality.

### 2.3. Rich Data Visualization
Interactive charts, powered by Recharts, provide a clear and intuitive understanding of aggregate properties.

-   **Logarithmic Scale Charts:** All grading curves are correctly plotted on a logarithmic x-axis for sieve sizes, as is standard engineering practice.
-   **Dynamic Tooltips:** Hovering over chart points reveals detailed information, including `% Passing`, sieve size, and the upper/lower specification limits for that point.
-   **Clear Visual Cues:** Charts include clear legends, specification limit bands (as a shaded area), and out-of-spec data point highlighting.

### 2.4. Professional PDF Reporting
With a single click, users can generate detailed, shareable PDF reports.

-   **Branded & Professional:** The header of each page includes the **UltraTech and ABG logos**, the test name, and a page number.
-   **Comprehensive Summary:** Reports include the test name, date, and detailed tables for input weights and all calculated results (`% Retained`, `Cumulative % Retained`, `% Passing`, and `Remark`).
-   **Visuals Included:** The generated grading curve charts for each analysis, including the combined gradation, are embedded directly into the PDF.
-   **Client-Side Generation:** PDF generation is handled instantly in the browser using `jsPDF` and `jspdf-autotable`. The file size is optimized for easy sharing via email or messaging apps.

### 2.5. User Account Management
The application provides a secure and personalized experience for every user.

-   **Authentication:** Users can sign up and log in using Email/Password or with their Google account, powered by **Firebase Authentication**.
-   **Profile Management:** Logged-in users can view and update their profile information, such as their name.

---

## 3. Technology Stack & Architecture

### 3.1. Frontend
-   **Framework:** **Next.js 15** (App Router)
-   **Language:** **TypeScript**
-   **UI Library:** **React**
-   **UI Components:** **ShadCN/UI** - A collection of beautifully designed, accessible, and composable components.
-   **Styling:** **Tailwind CSS** for a utility-first styling approach.
-   **Charting:** **Recharts** for creating interactive and responsive charts.
-   **Form Management:** **React Hook Form** with **Zod** for robust, type-safe form validation.

### 3.2. Backend & Database
-   **Authentication:** **Firebase Authentication** for secure user management and identity services (Email/Password, Google Sign-In).
-   **Database:** **Firestore** for storing user profile data.

### 3.3. Tooling & Libraries
-   **PDF Generation:** **jsPDF** and **jspdf-autotable** for creating professional PDF reports directly on the client-side.
-   **Deployment:** The application is configured for deployment on modern hosting services like Firebase App Hosting or Vercel.

---

## 4. Application Logic & Flow

### 4.1. Sieve Analysis Calculation (`/src/lib/sieve-analysis.ts`)
-   **Input:** The core logic takes two inputs: an array of weights retained on each sieve (plus the pan) and the corresponding array of sieve sizes.
-   **Core Calculation:**
    1.  Calculates the total sample weight.
    2.  Computes **% Retained** for each sieve.
    3.  Computes **Cumulative % Retained**.
    4.  Computes **% Passing** as `100 - Cumulative % Retained`.
-   **Classification (Fine Aggregate):**
    -   The `classifyFineAggregate` function determines the grading zone **based solely on the `% Passing` value of the 600-micron sieve**, as per the requirement.
    -   If the full sample does not conform to that zone, it falls back to a "Does not conform" classification but uses a `findBestFitZone` function to identify the closest zone for reporting purposes.
-   **Fineness Modulus:** Calculated by summing the cumulative percentages retained on standard sieves (from 4.75mm down to 150-micron) and dividing by 100.

### 4.2. Combined Gradation Logic
-   The combined `% Passing` for any given sieve is calculated using a weighted average formula:
    `Combined % = (FineAgg % * FineAggPassing) + (CoarseAgg % * CoarseAggPassing)`
-   For the three-material blend, this extends to:
    `Combined % = (FA % * FA_Passing) + (20mm % * 20mm_Passing) + (10mm % * 10mm_Passing)`
-   The application ensures that all sieve sizes from all selected materials are accounted for, interpolating `100%` for sieves larger than the material's largest sieve and `0%` for those smaller.

### 4.3. PDF Generation Flow (`/src/lib/generate-pdf.ts`)
1.  **Initiation:** The `generatePdf` function is called with all the current analysis data.
2.  **Image Fetching:** It asynchronously fetches the UT and ABG logos and converts them to Base64 to be embedded in the PDF.
3.  **Chart Conversion:** It identifies the chart SVG elements in the DOM, clones them, applies all computed CSS styles (to ensure they look correct), and converts them into optimized JPEG images using an off-screen canvas. This is the key step for file size optimization.
4.  **Document Assembly:**
    -   A new `jsPDF` document is created.
    -   A header and footer are added to every page, containing the logos, test name, and page numbers.
    -   It iterates through each available result (Fine, Coarse, Combined) and programmatically adds sections of content.
    -   Each section includes summary cards, detailed results tables (created with `jspdf-autotable`), and the corresponding chart image.
    -   The function intelligently checks for remaining page space and adds new pages as needed to prevent content from being cut off.
5.  **Save:** The final, assembled PDF is saved to the user's device.
