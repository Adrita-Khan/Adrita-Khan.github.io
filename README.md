
<html>
<head>
    <style>
        /* Define the CSS for the boxed section */
        .section-box {
            border: 2px solid #e1e4e8; /* Border style, width, and color */
            padding: 10px; /* Padding inside the box */
            background-color: #f6f8fa; /* Background color */
            margin: 20px 0; /* Adjust the margin as needed */
        }

        /* Define styles for the content within the box */
        .section-header {
            font-weight: bold;
        }

        .section-list {
            list-style-type: none; /* Remove bullet points */
            padding: 0;
        }

        .section-item {
            margin: 5px 0; /* Adjust spacing between items */
        }

        .publication-link {
            color: #0366d6; /* Link color */
            text-decoration: none; /* Remove underline from links */
        }

        .project-image {
            max-width: 100%; /* Ensure images don't exceed the box width */
        }
    </style>
</head>
<body>
    <h1>Physics Graduate with a Minor in Astronomy</h1>

    <!-- Education Section -->
    <div class="section-box">
        <h2 class="section-header">Education</h2>
        <p>
            Bachelor of Science (Hons.) | Major in Physics | Minor in Astronomy | Universiti Sains Malaysia (University of Science, Malaysia) | (2019 - 2023)
        </p>
        <ul class="section-list">
            <li class="section-item">Relevant Courses:
                <ul>
                    <li>Classical Mechanics I and II, Quantum Mechanics, Thermodynamics, Statistical Mechanics, Electricity and Magnetism I and II, Atomic and Nuclear Physics, Solid State Physics I and II, Modern Physics, Optics, Radiation Biophysics, Laser and Its Applications, Non-Destructive Testing, Vibrations, Waves and Optics, Electronics I and II, Physics practical I, II, III and IV, Introduction to Astronomy, Structure of the Universe, Principles and Practices in Astronomy, Introduction to Radio Astronomy, Calculus, Linear Algebra and Vector Analysis, Complex Analysis and Differential Equations, Mathematical Methods, Artificial Intelligence Literacy, Principles of Data Analytics, Writing for Professional Communication, Scientific and Medical English, Sustainability: Issues, Challenges, and Prospects, English Poetry, Speech Writing and Public Speaking, Spoken English.</li>
                </ul>
            </li>
        </ul>
    </div>

    <hr> <!-- Horizontal line after the Education section -->

    <!-- Work Experience Section -->
    <div class="section-box">
        <h2 class="section-header">Work Experience</h2>
        <p>Data Scientist @ Toyota Financial Services (June 2022 - Present)</p>
        <ul class="section-list">
            <li class="section-item">Uncovered and corrected missing step in production data pipeline which impacted over 70% of active accounts</li>
            <li class="section-item">Redeveloped loan originations model which resulted in 50% improvement in model performance and saving 1 million dollars in potential losses</li>
        </ul>

        <p>Data Science Consultant @ Shawhin Talebi Ventures LLC (December 2020 - Present)</p>
        <ul class="section-list">
            <li class="section-item">Conducted data collection, processing, and analysis for novel study evaluating the impact of over 300 biometrics variables on human performance in hyper-realistic, live-fire training scenarios</li>
            <li class="section-item">Applied unsupervised deep learning approaches to longitudinal ICU data to discover novel sepsis sub-phenotypes</li>
        </ul>
    </div>

    <hr> <!-- Horizontal line after the Work Experience section -->

    <!-- Projects Section -->
    <div class="section-box">
        <h2 class="section-header">Projects</h2>
        <p><a class="publication-link" href="https://www.mdpi.com/1424-8220/22/8/3048">Data-Driven EEG Band Discovery with Decision Trees</a></p>
        <p>Developed objective strategy for discovering optimal EEG bands based on signal power spectra using Python. This data-driven approach led to better characterization of the underlying power spectrum by identifying bands that outperformed the more commonly used band boundaries by a factor of two. The proposed method provides a fully automated and flexible approach to capturing key signal components and possibly discovering new indices of brain activity.</p>
        <img class="project-image" src="/assets/img/eeg_band_discovery.jpeg" alt="EEG Band Discovery">

        <p><a class="publication-link" href="https://www.mdpi.com/1424-8220/22/11/4240">Decoding Physical and Cognitive Impacts of Particulate Matter Concentrations at Ultra-Fine Scales</a></p>
        <p>Used Matlab to train over 100 machine learning models which estimated particulate matter concentrations based on a suite of over 300 biometric variables. We found biometric variables can be used to accurately estimate particulate matter concentrations at ultra-fine spatial scales with high fidelity (r2 = 0.91) and that smaller particles are better estimated than larger ones. Inferring environmental conditions solely from biometric measurements allows us to disentangle key interactions between the environment and the body.</p>
        <img class="project-image" src="/assets/img/bike_study.jpeg" alt="Bike Study">
    </div>

    <hr> <!-- Horizontal line after the Projects section -->

    <!-- Talks & Lectures Section -->
    <div class="section-box">
        <h2 class="section-header">Talks & Lectures</h2>
        <ul class="section-list">
            <li class="section-item">Causality: The new science of an old question - GSP Seminar, Fall 2021</li>
            <li class="section-item">Guest Lecture: Dimensionality Reduction - Big Data and Machine Learning for Scientific Discovery (PHYS 5336), Spring 2021</li>
        </ul>
    </div>

    <hr> <!-- Horizontal line after the Talks & Lectures section -->

    <!-- Publications Section -->
    <div class="section-box">
        <h2 class="section-header">Publications</h2>
        <ul class="section-list">
            <li class="section-item">Publication 1</li>
            <li class="section-item">Publication 2</li>
            <li class="section-item">Publication 3</li>
        </ul>
    </div>

    <!-- Social Media Links -->
    <p><a href="https://www.youtube.com/channel/UCa9gErQ9AE5jT2DZLjXBIdA">Data Science YouTube</a></p>

    <p><a href="https://medium.com/@shawhin">Data Science Blog</a></p>
</body>
</html>
