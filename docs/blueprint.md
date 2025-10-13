# **App Name**: SieveLab

## Core Features:

- User Authentication: Enable user login and signup using Firebase Authentication (email/password, Google Sign-In).
- Firestore Integration: Store sieve analysis data, user profiles, and report URLs in Firestore.
- New Test Creation: Allow users to input sieve weights, calculate % retained, cumulative % retained, % passing, Fineness Modulus, and classify samples.
- Data Visualization: Display sieve analysis results in tables and charts (using fl_chart).
- PDF Report Generation: Generate PDF reports of sieve analysis results using the pdf package.
- Report Storage and Retrieval: Store generated reports in Firebase Storage and retrieve them via URL.
- Material Recommendation Tool: Based on the test results, offer recommendations for suitable materials, acting as a tool that employs reasoning to decide when to present suggestions based on IS 383 standards.

## Style Guidelines:

- Primary color: Deep teal (#008080) evoking a sense of precision, and scientific accuracy.
- Background color: Very light grayish teal (#E0F8F8) to provide a calm and clean backdrop.
- Accent color: Analogous cyan blue (#00BFFF) for interactive elements and highlights.
- Body font: 'PT Sans', sans-serif, combines modernity with approachability for clear data presentation and readability.
- Headline font: 'Space Grotesk', sans-serif, adds a touch of contemporary tech to the app title.
- Use clear, technical icons representing different sieve sizes, material types, and actions (download, delete, etc.).
- Clean, data-focused layout with clear separation of sections for input, results, and actions.
- Subtle transitions when switching between pages and displaying test results.