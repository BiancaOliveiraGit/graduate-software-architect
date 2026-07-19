# Instructions for Using the Agent to Generate the Static Web App

This document explains the architecture, structure, and conventions required for the agent to successfully generate and maintain the static web application. The app is hosted as an Azure Storage Blob Static Website and uses JSON files as its data source.

---

## 1. Overview
The static web app is a lightweight, file-driven solution designed to present design challenges and their corresponding solution documents. All content is stored in Azure Storage Blob, and the app reads JSON data files to dynamically render dashboard cards and solution pages.

---

## 2. Architecture Summary

### Components

- **Azure Storage Blob (Static Website Hosting)** Hosts HTML, CSS, JS, images, and markdown files.
- Provides public or restricted access via static website endpoint.

- **Data Source Folder (`/datasource`)** Contains JSON files describing design challenges.
- Each JSON file represents one dashboard card and links to a solution-design markdown file.

- **Dashboard Page (`index.html`)** Displays clickable thumbnail cards.
- Cards are generated from JSON metadata.

- **Solution Pages (`solution-design.md`)** Markdown files rendered into HTML.
- Displayed when a dashboard card is selected.

### High-Level Flow

```
User → Dashboard (index.html) → Click Card → Load JSON → Render solution-design.md
```

---

## 3. Folder Structure

```
root/
│
├── index.html                 # Dashboard
├── styles/                    # CSS
├── scripts/                   # JS logic
├── assets/                    # Images/icons
├── datasource/                # JSON data files
│   ├── challenge1.json
│   ├── challenge2.json
│   └── ...
└── solutions/                 # Markdown solution files
    ├── challenge1-solution.md
    ├── challenge2-solution.md
    └── ...
```

---

## 4. JSON Data Structure
Each JSON file must follow this structure:

```
{
  "id": "challenge1",
  "title": "Design Challenge Title",
  "thumbnail": "assets/challenge1.png",
  "summary": "Short description of the challenge.",
  "solutionFile": "solutions/challenge1-solution.md"
}
```

### Required Fields

- **id** – Unique identifier.
- **title** – Display name on dashboard.
- **thumbnail** – Image path for the card.
- **summary** – Brief explanation shown on the card.
- **solutionFile** – Path to the markdown file.

---

## 5. Dashboard Rendering Logic
The dashboard page:

- Loads all JSON files from `/datasource`.
- Creates a card for each challenge.
- Displays thumbnail, title, and summary.
- On click, navigates to a solution viewer page.

---

## 6. Solution Viewer Logic
The solution viewer:

- Reads the `solutionFile` path from the selected JSON.
- Fetches the markdown file.
- Converts markdown to HTML.
- Renders it inside the page.

---

## 7. Agent Instructions
When using the agent to generate or update the static web app:

- Ensure all new challenges include both a JSON file and a solution markdown file.
- Maintain consistent naming conventions.
- Validate JSON structure before upload.
- Confirm that thumbnails exist in `/assets`.
- Ensure markdown files follow the solution design template.

---

## 8. Solution Design Markdown Requirements
Each solution-design.md file must follow the template-solution-design.md to ensure consistency and completeness. The template provides the required structure and sections that every solution-design.md should include:

- Business objective
- Assumptions
- Constraints & budget
- Functional requirements
- Non-functional requirements
- Azure architecture
- Security considerations
- Risks
- Decision matrix
- Stakeholder questions

Each `solution-design.md` file should include:

- Business objective
- Assumptions
- Constraints & budget
- Functional requirements
- Non-functional requirements
- Azure architecture
- Security considerations
- Risks
- Decision matrix
- Stakeholder questions

---

## 9. Deployment Notes

- Deployment is performed via Bicep deployment.
- The Bicep deployment includes all required resources, including the resource group.
- Upload all files to Azure Storage Blob.
- Enable static website hosting.
- Set `index.html` as the default document.
- Set `404.html` if needed.
- Upload all files to Azure Storage Blob.

---

## 10. Future Enhancements

- Add search/filtering on dashboard.
- Add tagging for challenges.
- Add versioning for solution documents.
- Add authentication using Azure AD.

## 11. Architecture Review Board Prompt

Use the prompt file at [.github/prompts/architecture-review-board.prompt.md](.github/prompts/architecture-review-board.prompt.md) when you want to run an interactive architecture review board session with the AI agent.

The prompt instructs the agent to:
- ask which challenge is being reviewed,
- ask the review questions one at a time,
- challenge the user on functional and non-functional requirements,
- and summarize the conversation back into the review board file.

---

This instructions.md file ensures the agent understands the architecture and conventions required to generate and maintain the static web app effectively.
