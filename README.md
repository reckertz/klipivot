   # klipivot
   ## generic control of weather data files with parsing, pivottable and chart-creation

   ## Table of Contents
   - [Installation](#installation)
   - [Usage](#usage)
   - [Sources](#sources)
   - [Features](#features)
   - [Technologies Used](#technologies-used)
   - [Contributing](#contributing)
   - [License](#license)
   - [Contact](#contact)

   ## Installation
   klipivot is a node.js application with a browser interface, working on port 3000 with http.
   The installation can be done from github or zip from github.
   npm install has to be run before starting the application from the installation folder
   with node server.js

   a small change in the code of klipivot.js is necessary to assign the specific root-directory you need:
   ```
        let path = klipivot.getCookie("datapath");
        if (path === null) {
            path = JSON.stringify(["c:", "Projekte", "klimaapp", "public", "data"]);
            klipivot.setCookie("datapath", path);
        }
   ```
   if path === null then the assignment to path has to be changed to your needs.

   ## Usage
   After Installation as a prerequisite data has to be downloaded to get the raw data files,
   that shall be analyzed.
   Downloading data is not a part of klipivot, it is recommended to store the data files 
   in subdirectories of __dirname/data where __dirname is the root of the browserapplication.

   When klipivot is envoked from the browser with http://localhost:3000/klipivot.html
   the following steps are available:
   - Initially the contents of the data-Directory is shown
     - if the initial path must be changed, that has to be done in code (see above)
   - the user can navigate to subdirectories or choose files
   - when a file is chosen, a download to the browser is done and the file is parsed,
   the columnnames are transformed to be compliant with SQL-conventions. The following options are presented
     - the Pivot-Tab shows the pivot-control where you can control, filter and aggregate data
       - if you have a flat datastructure in the pivot-control, you can
         - click "Pivot to Clipboard" for a csv-based copy to clipboard
         - click "Pivot to Chart" to get a chart-analysis of the pivot data
     - the File-Tab shows the contents of the raw data file, you can select with highlighting,
     mark hyperlinks and download the file
     - the Chart-Tab shows the graphical analysis of the data  

   ## Sources
   Data from the following sources can be controlled and analyzed
   - <a href="https://data.icos-cp.eu/portal/#{%22filterCategories%22:{%22level%22:[1,2],%22theme%22:[%22atmosphere%22],%22project%22:[%22icos%22]}}">ICOSCO2H</a> Integrated Carbon Observation System, on the page you have to choose the CO2-Data hourly
  - <a href=https://data.icos-cp.eu/portal/#%7B%22filterCategories%22%3A%7B%22project%22%3A%5B%22icos%22%5D%2C%22stationclass%22%3A%5B%22ICOS%22%5D%2C%22theme%22%3A%5B%22atmosphere%22%5D%2C%22type%22%3A%5B%22atcMtoL2DataObject%22%5D%7D%7D>ICOSMETH</a> Integrated Carbon Observation System, on the page you have to choose the Meteo-Data hourly
  - <a href=https://gml.noaa.gov/aftp/data/greenhouse_gases/co2/in-situ/surface/>NOAACO2H</a>NOAA GML Global Monitoring Laboratory with hourly CO2-Data
  - <a href=https://gml.noaa.gov/aftp/data/meteorology/in-situ/>NOAAMETH</a>NOAA GML Global Monitoring Laboratory with hourly Meteo-Data

   ## Features
   - data files are analzed in steps
     - the filename is parsed to get the data source
     - the file content is parsed to get the data content (header-row and data-rows)
     - the data is then prepared to be presented in the tabs
     - the user can choose the tabs

   ## Technologies Used
   - klipivot is programmed in JavaScript
   - node.js with express
   - jQuery and async by Caolan are used
   - Libraries
     - PivotTables
     - DataTables
     - ChartJS
     - Hilitor
     - FileSaver
   - VSCode

   ## Contributing
   Please get in Contact by message or eMail.

   ## License
   The project is licensed under the [MIT License](LICENSE).

   ## Contact
   - Rolf W. Eckertz
   - re2012@t-online.de