# dbdiagram-oss

An Open Source alternative to dbdiagram.io, aiming to have the same basic features+more. Motivation behind the project was that $9/month overpriced subscription for just some **very VERY** basic features. (dark mode/header colours/table groups)

---

## Installation

### Requirements
1. Frontend: `Vue & Quasar` (JavaScript)
2. Backend: `FastAPI` (Python)
3. Orchestration: `Docker Compose`

### Start containers
```
docker compose up -d
```

### Get URLs (frontend & backend)
```
docker compose run urls
```

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