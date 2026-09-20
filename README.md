
# dbdiagram-oss

An Open Source alternative to dbdiagram.io, aiming to have the same basic features+more. Motivation behind the project was that $9/month overpriced subscription for just some **very VERY** basic features. (dark mode/header colours/table groups)

---

## Run Commands

### Frontend (Vue)

```
cd frontend
npm run dev
```

### Backend (FastAPI)

```
cd backend
uvicorn main:app --reload --port 8000
```

---

## Forked Info

#### Actual docker version: 2.4.2

+ 1. Crappy auto-layout algorithm
+ 2. Remote S3 repository
+ 3. Repaired bug correct redrawing after changing the file
+ 4. Repaired bug droping "text" field in localStorage when selecting another clean file
+ 5. Docker image (single folder in S3 repo):  docker pull nomadshub/dbdiagrams-oss-wrep:2.3.7
+ 6. Docker image (multiple folders in S3 repo):  docker pull nomadshub/dbdiagrams-oss-wrep:2.4.0

### Sep.23 update
+ 6. Notifications for repository actions
+ 7. Added relation labels (1 or *) (minor positioning issues)
+ 7. Custom header colors (done)
+ 8. Export to SVG, PNG, Json
+ 9. Several new bugs (decision is in progress)
+ 10. Next cool update for header and relation labels will be later...
 
### Oct.23 update
+ 11. Added field tooltion with note, enum description and default
+ 12. Redesign table tooltip, added indexes
+ 13. Added not null and enum tag on diagram

### Feb.24 update
+ 14. Shifts of header color bug repaired
+ 15. Added touch screen support (hover table header = hold touch) (without gestures)
+ 16. Added PNG resolution change in export form (default is better quality)
+ 17. Added import json files
+ 18. Added actions for refs control points (add, reset, delete)
+ 19. Added diagram fit function
+ 20. Fix key icon positioning
+ 21. Show key icon for columns in composite PK
+ 22. Fix table header color reshuffle when changing the code
+ 23. Fix table positioning when changeing table ordering in code

## Publish v2.4.0

### Mar.24 update
+ 24. Added multiple folders support for S3 repo
+ 25. Added export to DBML, SQL (Postgres, MSSQL, MySQL)
+ 26. Added import from SQL (Postgres)

---

## Installation

### Install the dependencies
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
yarn lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

---

## Architecture - Solution

![Arch](https://raw.githubusercontent.com/IlyaBashlyaev/dbdiagram-oss/master/.github/media/arch.png)

---

## Repository settings demo

https://github.com/NomadRazor/dbdiagram-oss-wrep/assets/36404538/d7893336-13b5-431a-97d1-2cddc6073aec

---

## Tooltips demo

https://github.com/NomadRazor/dbdiagram-oss-wrep/assets/36404538/261f2283-af2b-4044-8d98-80d70270ef43

---

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

## Screenshots

![Demo GIF](https://raw.githubusercontent.com/TruDan/dbdiagram-oss/master/.github/media/demo.gif)

---

## Related

[quasar](https://quasar.dev/) - Awesome VueJS framework

[jointjs](https://github.com/clientIO/joint) - Charting Library used for diagrams

[dbml.org](https://www.dbml.org/home/) - DBML Parser/importer/exporter

[dbdiagram.io](https://dbdiagram.io/home) - Original DBDiagram tool

[dbdocs.io](https://dbdocs.io/) - Documentation generator for DBML