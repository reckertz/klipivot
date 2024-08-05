/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global klipivot, console, kla6900,kla6950,kla6960,kla6970 */
(function () {
    "use strict";
    let klipivot = {};
    // test
    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;

    let gblpivot = {};
    let pivotrecords = [];
    let myHilitor;
    /**
     * klipivot - 
     */
    klipivot.show = function (args) {
        $('body').css({
            'overflow': 'hidden',
            'height': $(window).height() + 'px'
        });
        $(".col1of2").css("width", '20%');
        $(".col2of2").css("width", '75%');

        $(".col1of2").css("height", $(window).height() + 'px');
        $(".col2of2").css("height", $(window).height() + 'px');
        Chart.defaults.font.weight = "bold";
        let path = klipivot.getCookie("datapath");
        if (path === null) {
            path = JSON.stringify(["c:", "Projekte", "klimaapp", "public", "data"]);
            klipivot.setCookie("datapath", path);
        }
        path = JSON.parse(path);
        klipivot.showDirectory(path, true, function (ret) {
            return;
        });
    };

    /**
     * klipivot.getFiletype
     * @param {*} filename 
     * @returns source, color
     */
    klipivot.getFiletype = function (filename) {
        // Datei bzw. Kandidat für Datei
        let filetypes = [{
                sample: "ICOS_ATC_L2_L2-2024.1_KIT_30.0_CTS.CO2",
                source: "ICOSCO2H",
                startsWith: "ICOS_ATC_L2",
                endsWith: "_CTS.CO2",
                metaRule: "#",
                headerRule: "last#",
                columnSeparator: ";"
            },
            {
                sample: "ICOS_ATC_L2_L2-2023.1_KIT_30.0_CTS.MTO",
                source: "ICOSMETH",
                startsWith: "ICOS_ATC",
                endsWith: "_CTS.MTO",
                metaRule: "#",
                headerRule: "last#",
                columnSeparator: ";"
            },
            {
                sample: "co2_mlo_surface-insitu_1_ccgg_HourlyData.txt",
                source: "NOAACO2H",
                startsWith: "co2_",
                endsWith: "_ccgg_HourlyData.txt",
                metaRule: "#",
                headerRule: "", // erste Zeile ohne #
                columnSeparator: " " // Blank, gewöhnungsbedürftig
            },
            {
                sample: "met_mlo_insitu_1_obop_hour_2021.txt",
                source: "NOAAMETH",
                startsWith: "met_",
                endsWith: ".txt",
                metaRule: "",
                headerRule: "", // erste Zeile ohne #
                columnSeparator: " " // Spezielle Aufteilung, dediziert realisiert
            },
        ];
        let filesource = "";
        let color = "lightsteelblue";
        for (let i = 0; i < filetypes.length; i++) {
            let parms = filetypes[i];
            let hit = true;
            if (typeof parms.startsWith !== "undefined" && !filename.startsWith(parms.startsWith)) {
                hit = false;
                continue;
            }
            if (typeof parms.endsWith !== "undefined" && !filename.endsWith(parms.endsWith)) {
                hit = false;
                continue;
            }
            if (hit === true) {
                filesource = parms.source;
                color = "lightgreen";
                break;
            }
        }
        return {
            source: filesource,
            color: color
        }
    };

    klipivot.showDirectory = function (path, isfirst, cb0000) {
        async.waterfall([
                function (cb1000) {
                    let ret = {};
                    $("#file-browser").children().remove();
                    $("#file-browser")
                        .append($("<ul/>", {
                            css: {
                                "list-style-type": "none",
                                "margin-top": "20px",
                                padding: 0
                            },
                            id: "file-list"
                        }));
                    cb1000(null, ret);
                    return;
                },
                function (ret, cb1010) {

                    let jqxhr = $.ajax({
                        method: "GET",
                        crossDomain: false,
                        url: "api/files",
                        data: {
                            path: path,
                            isfirst: isfirst
                        }
                    }).done(function (r1, textStatus, jqXHR) {
                        if (textStatus === "success" && typeof r1 === "object" && Array.isArray(r1)) {
                            ret.files = r1;
                            cb1010(null, ret);
                            return
                        } else {
                            ret.error = true;
                            ret.message = err.textStatus + " no correct response";
                            cb1010("Error", ret);
                            return
                        }
                    }).fail(function (err) {
                        ret.error = true;
                        ret.message = err.responseText;
                        cb1010("Error", ret);
                        return;
                    }).always(function () {
                        // nope
                    });
                },
                function (ret, cb1020) {
                    let file = ret.files[0];
                    $("#file-list")
                        .append($("<li/>", {
                                class: "klifile clickable-item",
                                // U+21E6 LEFTWARDS WHITE ARROW ⇦   &#x21E6;
                                title: file.path,
                                filepath: file.path + "..",
                                filename: "",
                                isDirectory: "true"
                            })
                            .append($("<button/>", {
                                class: "clickable-item",
                                css: {
                                    "min-width": "100%",
                                    "background-color": "pink"
                                },
                                html: "<b>&#x2B05;" + file.path + "</b>"
                            }))
                        );
                    ret.files.forEach(function (file, ifile) {
                        if (file.isDirectory === "true" || file.isDirectory === true) {
                            $("#file-list")
                                .append($("<li/>", {
                                        class: "klifile clickable-item",
                                        title: file.path,
                                        filepath: file.path,
                                        filename: file.name,
                                        isDirectory: file.isDirectory
                                    })
                                    .append($("<button/>", {
                                        class: "clickable-item",
                                        css: {
                                            "min-width": "100%",
                                            "background-color": "mistyrose"
                                        },
                                        html: file.name
                                    }))
                                );
                        } else {
                            let html = "";
                            html += file.name;
                            let liclass = "";
                            let parms = klipivot.getFiletype(file.name);
                            if (parms.source.length > 0) {
                                liclass = "clickable-item";
                                html += "<br><b>" + parms.source + " (" + file.size.toLocaleString('de-DE', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                    useGrouping: true,
                                }) + ")</b>"
                            }
                            $("#file-list")
                                .append($("<li/>", {
                                        class: "klifile " + liclass,
                                        css: {
                                            "min-width": "100%",
                                            "background-color": parms.color
                                        },
                                        source: parms.source,
                                        title: file.path,
                                        filepath: file.path,
                                        filename: file.name,
                                        isDirectory: file.isDirectory,
                                        size: file.size
                                    })
                                    .append($("<button/>", {
                                        class: liclass,
                                        css: {
                                            "min-width": "80%",
                                            "background-color": parms.color
                                        },
                                        html: html
                                    }))
                                );
                        }
                    });
                    cb1020(null, ret);
                    return
                }
            ],
            function (err, ret) {
                return;
            });
    };

    $(document).on("click", ".klifile", function (evt) {
        evt.preventDefault();
        // hier geht es in die TAB-Steuerung!!!
        let file = {};
        let ret = {};
        file.isDirectory = $(this).attr("isDirectory");
        file.filename = $(this).attr("filename");
        file.filepath = $(this).attr("filepath");
        file.size = $(this).attr("size");
        file.source = $(this).attr("source");
        if (file.isDirectory === "true" || file.isDirectory === true) {
            //createFileBrowser(path.join(file.filepath, file.filename));
            let path = file.filepath + file.filename;
            klipivot.showDirectory(path, false, function (ret) {
                return;
            });
        } else {
            //const data = fetchFileData(path.join(file.filepath, file.filename));
            //createPivotTable(data);
            // Analyse
            let fullfilepath = $(this).attr("filepath") + $(this).attr("filename");
            let jqxhr = $.ajax({
                method: "GET",
                crossDomain: false,
                url: "api/file",
                data: {
                    source: file.source,
                    fullfilepath: fullfilepath
                }
            }).done(function (r1, textStatus, jqXHR) {
                if (textStatus === "success" && typeof r1 === "object" && Object.keys(r1).length > 0) {
                    klipivot.showData(r1);
                    return
                } else {
                    ret.error = true;
                    ret.message = err.textStatus + " no correct response";
                    return
                }
            }).fail(function (err) {
                ret.error = true;
                ret.message = err.responseText;
                return;
            }).always(function () {
                // nope
            });

        }
    });

    klipivot.showTabs = function () {
        $(".col2of2").children().remove();
        // https://www.w3schools.com/howto/howto_js_tabs.asp
        $(".col2of2")
            .append($("<div/>", {
                    class: "tab",
                    id: "klipivottab0"
                })
                .append($("<button/>", {
                    class: "tablinks",
                    id: "klipivotbut1",
                    onclick: "klipivot.openTab(event, 'klipivottab1')",
                    html: "Pivot"
                }))
                .append($("<button/>", {
                    class: "tablinks",
                    id: "klipivotbut2",
                    onclick: "klipivot.openTab(event, 'klipivottab2')",
                    html: "File"
                }))
                .append($("<button/>", {
                    class: "tablinks",
                    id: "klipivotbut3",
                    onclick: "klipivot.openChartTab(event, 'klipivottab3')",
                    html: "Chart"
                }))
            );

        $(".col2of2")
            .append($("<div/>", {
                id: "klipivottab1",
                class: "tabcontent"
            }));

        $(".col2of2")
            .append($("<div/>", {
                id: "klipivottab2",
                class: "tabcontent"
            }));

        $(".col2of2")
            .append($("<div/>", {
                id: "klipivottab3",
                class: "tabcontent"
            }));
    };

    klipivot.openTab = function (evt, id) {
        var i, tabcontent, tablinks;
        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            //tablinks[i].className = tablinks[i].className.replace(" active", "");
            $(tablinks[i]).removeClass("active");
        }
        // Show the current tab, and add an "active" class to the button that opened the tab
        document.getElementById(id).style.display = "block";
        //evt.currentTarget.className += " active";
        $(evt.currentTarget).addClass("active");
    };

    /**
     * klipivot.openChartTab
     * @param {*} evt 
     * @param {*} id 
     */
    klipivot.openChartTab = function (evt, id) {
        klipivot.openTab(evt, id);

        // jetzt wird erst der Inhalt gefüllt:
        /*
        let x = gblpivot;
        // Wait for the PivotTable to be fully initialized
        $("#" + id).children().remove();
        for (let i = 0; i < 10; i++) {
            let html = JSON.stringify(pivotrecords[i]);
            $("#" + id)
                .append("<span/>", {
                    html: html + "<br>"
                });
        }
        */
    };

    klipivot.showData = function (r1, cb0000) {
        async.waterfall([
                function (cb1200) {
                    let ret = {};
                    klipivot.showTabs();
                    $("#klipivottab1").children().remove();
                    $("#klipivottab1")
                        .append($("<div/>", {
                                css: {
                                    width: "100%",
                                    "background-color": "lightsteelblue",
                                    "margin": "10px",
                                    float: "left"
                                }
                            })
                            .append($("<button/>", {
                                class: "btn btn-info",
                                css: {
                                    "font-weight": "bolder",
                                    float: "left",
                                    "margin-left": "20px"
                                },
                                html: "Pivot to Clipboard",
                                title: "Pivottabelle als CSV ins Clipboard kopieren",
                                click: function (evt) {
                                    evt.preventDefault();
                                    // Assume you have an existing PivotTable instance, often created like this:
                                    // $('#myreport').pivotUI(data, options);
                                    // You can access the pivotData object
                                    //var pivotData = $('#myreport').data('pivotUIOptions').pivotData;
                                    let pivotTable = $('#myreport').find(".pvtTable"); // Access the raw DOM element
                                    //let actualPivotRecords = klipivot.getPivotRecords(pivotTable);
                                    klipivot.copyToClipboard(pivotTable);
                                }
                            }))
                            .append($("<button/>", {
                                class: "btn btn-info",
                                css: {
                                    "font-weight": "bolder",
                                    float: "left",
                                    "margin-left": "20px"
                                },
                                html: "Pivot to Chart",
                                title: "Pivottabelle als Chart aufbreiten und ausgeben",
                                click: function (evt) {
                                    evt.preventDefault();
                                    let pivotTable = $('#myreport').find(".pvtTable"); // Access the raw DOM element
                                    klipivot.copyToChart(pivotTable);
                                }
                            }))
                        );
                    $("#klipivottab1")
                        .append($("<div/>", {
                                css: {
                                    width: "100%",
                                    float: "left"
                                },
                                id: "pivot-table"
                            })
                            .append($("<div/>", {
                                width: "100%",
                                id: "myreport"
                            }))
                        );
                    cb1200(null, ret);
                    return;
                },
                function (ret, cb1220) {
                    debugger;
                    let fileContent = r1.fileContent;
                    let source = r1.source;
                    let fullfilename = r1.fullfilename;
                    let filename = r1.filename;
                    $("#klipivottab0").attr("source", source);
                    $("#klipivottab0").attr("fullfilename", fullfilename);
                    $("#klipivottab0").attr("filename", filename);
                    $("#klipivottab0")
                        .append($("<button/>", {
                            html: "<b>" + source + " - " + filename + "</b>"
                        }));
                    let filetype = {};
                    let lines = fileContent.split(/\r\n|\r|\n/);
                    ret.records = [];
                    if (source === "ICOSCO2H") {
                        let fields = [];
                        for (let iline = 0; iline < lines.length - 1; iline++) {
                            if (lines[iline].startsWith("#") && !lines[iline + 1].startsWith("#")) {
                                fields = lines[iline].substring(1).split(";");
                                for (let irec = iline + 1; irec < lines.length; irec++) {
                                    let datas = lines[irec].split(";");
                                    let record = {};
                                    fields.forEach(function (field, ifield) {
                                        record[field] = datas[ifield];
                                    });
                                    ret.records.push(record);
                                }
                                pivotrecords = [];

                                let pivotConfig = klipivot.getCookie("pivotConfig_" + source);
                                if (pivotConfig === null) {
                                    gblpivot = $("#myreport").pivotUI(
                                        ret.records, {
                                            rows: [],
                                            cols: [],
                                            vals: []
                                        });
                                } else {
                                    pivotConfig = JSON.parse(pivotConfig);
                                    gblpivot = $("#myreport").pivotUI(
                                        ret.records, {
                                            rows: pivotConfig.rows,
                                            cols: pivotConfig.cols,
                                            vals: pivotConfig.vals,
                                            exclusions: pivotConfig.exclusions,
                                            inclusions: pivotConfig.inclusions,
                                            inclusionsInfo: pivotConfig.inclusionsInfo,
                                        });
                                }
                                break;
                            }
                        }
                    } else if (source === "ICOSMETH") {
                        klipivot.prepICOSMETH(lines, ret);
                        pivotrecords = [];
                        let pivotConfig = klipivot.getCookie("pivotConfig_" + source);
                        if (pivotConfig === null) {
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: [],
                                    cols: [],
                                    vals: []
                                });
                        } else {
                            pivotConfig = JSON.parse(pivotConfig);
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: pivotConfig.rows,
                                    cols: pivotConfig.cols,
                                    vals: pivotConfig.vals,
                                    exclusions: pivotConfig.exclusions,
                                    inclusions: pivotConfig.inclusions,
                                    inclusionsInfo: pivotConfig.inclusionsInfo,
                                });
                        }
                    } else if (source === "NOAACO2H") {
                        klipivot.prepNOAACO2H(lines, ret);
                        pivotrecords = [];
                        let pivotConfig = klipivot.getCookie("pivotConfig_" + source);
                        if (pivotConfig === null) {
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: [],
                                    cols: [],
                                    vals: []
                                });
                        } else {
                            pivotConfig = JSON.parse(pivotConfig);
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: pivotConfig.rows,
                                    cols: pivotConfig.cols,
                                    vals: pivotConfig.vals,
                                    exclusions: pivotConfig.exclusions,
                                    inclusions: pivotConfig.inclusions,
                                    inclusionsInfo: pivotConfig.inclusionsInfo,
                                });
                        }

                    } else if (source === "NOAAMETH") {
                        klipivot.prepNOAAMETH(lines, ret);
                        pivotrecords = [];
                        let pivotConfig = klipivot.getCookie("pivotConfig_" + source);
                        if (pivotConfig === null) {
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: [],
                                    cols: [],
                                    vals: []
                                });
                        } else {
                            pivotConfig = JSON.parse(pivotConfig);
                            gblpivot = $("#myreport").pivotUI(
                                ret.records, {
                                    rows: pivotConfig.rows,
                                    cols: pivotConfig.cols,
                                    vals: pivotConfig.vals,
                                    exclusions: pivotConfig.exclusions,
                                    inclusions: pivotConfig.inclusions,
                                    inclusionsInfo: pivotConfig.inclusionsInfo,
                                });
                        }

                    } else {
                        source = "?";

                    }
                    cb1220(null, ret);
                    return
                },
                function (ret, cb1230) {
                    let source = r1.source;
                    let fullfilename = r1.fullfilename;
                    let filename = r1.filename;
                    let filetype = {};
                    let html = r1.fileContent.replace(/\r\n|\r|\n/g, '<br/>');
                    myHilitor = new Hilitor("klipivotraw"); // id of the element to parse
                    $("#klipivottab2")
                        .append($("<div/>", {
                            css: {
                                "margin": "10px",
                                "background-color": "lightsteelblue"
                            },
                            id: "klipivotrawbuttons"
                        }))
                        .append($("<span/>", {
                            id: "klipivotraw",
                            class: "noprint",
                            html: html,
                            filename: r1.filename,
                            css: {
                                "margin-top": "20px",
                                width: "100%",
                                "float": "left",
                                "font-family": "monospace"
                            }
                        }));

                    $("#klipivotrawbuttons")
                        .append($("<form/>")
                            .append($("<label/>", {
                                for: "text-search",
                                html: "Text-Suche"
                            }))
                            .append($("<input/>", {
                                type: "search",
                                id: "text-search",
                                name: "klipivotrawsearch",
                                //autocomplete: "on",
                                placeholder: "Suchbegriff…"
                            }))
                            .append($("<button/>", {
                                class: "btn btn-secondary",
                                text: "Suche",
                                title: "Hervorhebung der Treffer",
                                click: function (evt) {
                                    evt.preventDefault();
                                    myHilitor.apply($("#text-search").val());
                                }
                            }))
                            .append($("<button/>", {
                                class: "btn btn-secondary",
                                text: "Reset",
                                title: "Rücksetzen der Hervorhebung der Treffer",
                                click: function (evt) {
                                    evt.preventDefault();
                                    myHilitor.remove();
                                }
                            }))
                            .append($("<button/>", {
                                class: "btn btn-secondary",
                                text: "Hyperlinks hervorheben",
                                click: function (evt) {
                                    evt.preventDefault();
                                    let text = $("#klipivotraw").html();
                                    if (text.indexOf("<a href=") >= 0) {
                                        return;
                                    }
                                    let urlRegex = /(((https?:\/\/)|(www\.))[^\s|<]+)/g;
                                    //var urlRegex = /(https?:\/\/[^\s]+)/g;
                                    let newtext = text.replace(urlRegex, function (url, b, c) {
                                        var url2 = (c == 'www.') ? 'http://' + url : url;
                                        return '<a href="' + url2 + '" target="_blank">' + url + '</a>';
                                    });
                                    $("#klipivotraw").html(newtext);
                                    console.log("X");
                                }
                            }))
                            .append($("<button/>", {
                                class: "btn btn-secondary",
                                text: "Textanzeige wiederherstellen",
                                title: "die Textdatei wird angezeigt ohne evtl. Hyperlinks und Suchhervorhebungen",
                                click: function (evt) {
                                    evt.preventDefault();
                                    $("#klipivotraw").html(originalhtml);
                                }
                            }))

                            .append($("<button/>", {
                                class: "btn btn-warning",
                                text: "Download Datei",
                                title: "Download der Originaldaten an den Browser",
                                click: function (evt) {
                                    evt.preventDefault();
                                    let filename = $("#klipivotraw").attr("filename");
                                    saveTextAs($("#klipivotraw").html(), filename + ".html", "UTF-8");
                                }
                            }))
                        );
                    cb1230(null, ret);
                    return
                }
            ],
            function (err, ret) {
                $("#klipivotbut1").trigger("click");
                return;
            });
    };



    /**
     * klipivot.prepICOSMETH - lines aufbereiten zu ret.records
     * funktioniert wie ICOSCO2H (!)
     * @param {*} lines 
     * @param {*} ret mit source, filename, 
     */
    klipivot.prepICOSMETH = function (lines, ret) {
        let fields = [];
        ret.records = [];
        for (let iline = 0; iline < lines.length - 1; iline++) {
            if (lines[iline].startsWith("#") && !lines[iline + 1].startsWith("#")) {
                fields = lines[iline].substring(1).split(";");
                for (let irec = iline + 1; irec < lines.length; irec++) {
                    let datas = lines[irec].split(";");
                    let record = {};
                    fields.forEach(function (field, ifield) {
                        record[field] = datas[ifield];
                    });
                    ret.records.push(record);
                }
            }
        }
    };



    /**
     * klipivot.prepNOAACO2H - lines aufbereiten zu ret.records
     * funktioniert wie ICOSCO2H (!) aber Blank-Separierung
     * und header in der ersten Zeile ohne #
     * @param {*} lines 
     * @param {*} ret mit source, filename, 
     */
    klipivot.prepNOAACO2H = function (lines, ret) {
        let fields = [];
        ret.records = [];
        if (lines.length < 2001) {
            for (let iline = 0; iline < lines.length - 1; iline++) {
                if (!lines[iline].startsWith("#")) {
                    fields = lines[iline].substring(1).split(" ");
                    for (let irec = iline + 1; irec < lines.length; irec++) {
                        let datas = lines[irec].split(" ");
                        let record = {};
                        fields.forEach(function (field, ifield) {
                            record[field] = datas[ifield];
                        });
                        ret.records.push(record);
                    }
                    break;
                }
            }
        } else {
            for (let iline = 0; iline < 1000; iline++) {
                if (!lines[iline].startsWith("#")) {
                    fields = lines[iline].substring(1).split(" ");
                    // erste 1000 Sätze bereitstellen
                    let von1 = iline + 1;
                    let bis1 = iline + 1 + 1000;
                    for (let irec = von1; irec < bis1; irec++) {
                        let datas = lines[irec].split(" ");
                        let record = {};
                        fields.forEach(function (field, ifield) {
                            record[field] = datas[ifield];
                        });
                        ret.records.push(record);
                    }
                    // letzte 1000 Sätze bereitstellen
                    let von2 = lines.length - 1000 - 1;
                    let bis2 = lines.length;
                    for (let irec = von2; irec < bis2; irec++) {
                        let datas = lines[irec].split(" ");
                        let record = {};
                        fields.forEach(function (field, ifield) {
                            record[field] = datas[ifield];
                        });
                        ret.records.push(record);
                    }
                    break;
                }
            }
        }
    };

    /**
     * klipivot.prepNOAAMETH - lines aufbereiten zu ret.records
     * funktioniert wie ICOSCO2H (!) aber spezielle Satzbeschreibung aus README
     * und keine Header-Zeile!!! sowie keine Metadaten
     * @param {*} lines 
     * @param {*} ret mit source, filename, 
     */
    klipivot.prepNOAAMETH = function (lines, ret) {
        let datafields = [];
        datafields.push([1, "SITE CODE", "station"]);
        datafields.push([2, "YEAR", "year"]);
        datafields.push([3, "MONTH", "month"]);
        datafields.push([4, "DAY", "day"]);
        datafields.push([5, "HOUR", "hour"]);
        datafields.push([6, "WIND DIRECTION", "wd"]);
        datafields.push([7, "WIND SPEED", "ws"]);
        datafields.push([8, "WIND STEADINESS FACTOR", "wsf"]);
        datafields.push([9, "BAROMETRIC PRESSURE", "ap"]);
        datafields.push([10, "TEMPERATURE at 2 Meters", "tt60_0002"]);
        datafields.push([11, "TEMPERATURE at 10 Meters", "tt60_0010"]);
        datafields.push([12, "TEMPERATURE at Tower Top", "tt60_TOP"]);
        datafields.push([13, "RELATIVE HUMIDITY", "rh"]);
        datafields.push([14, "PRECIPITATION INTENSITY", "pi"]);

        ret.records = [];
        if (lines.length < 2001) {
            for (let irec = 0; irec < lines.length; irec++) {
                let datas = lines[irec].split(/\s+/);
                let record = {};
                datafields.forEach(function (fieldparms, ifield) {
                    record[fieldparms[2]] = datas[ifield];
                });
                ret.records.push(record);
            }
        } else {
            for (let iline = 0; iline < 1000; iline++) {
                let von1 = iline + 1;
                let bis1 = iline + 1 + 1000;
                for (let irec = von1; irec < bis1; irec++) {
                    let datas = lines[irec].split(/\s+/);
                    let record = {};
                    datafields.forEach(function (fieldparms, ifield) {
                        record[fieldparms[2]] = datas[ifield];
                    });
                    ret.records.push(record);
                }
                // letzte 1000 Sätze bereitstellen
                let von2 = lines.length - 1000 - 1;
                let bis2 = lines.length;
                for (let irec = von2; irec < bis2; irec++) {
                    let datas = lines[irec].split(/\s+/);
                    let record = {};
                    datafields.forEach(function (fieldparms, ifield) {
                        record[fieldparms[2]] = datas[ifield];
                    });
                    ret.records.push(record);
                }
            }
        }
    };


    /**
     * klipivot.getPivotRecords - array der records aus pivot-HTML-Table
     * @param {*} pivotTable 
     * @returns records
     */
    klipivot.getPivotRecords = function (pivotTable) {
        // save config to cookie
        let config = $("#myreport").data("pivotUIOptions");
        var config_copy = JSON.parse(JSON.stringify(config));
        //delete some values which will not serialize to JSON
        delete config_copy["aggregators"];
        delete config_copy["renderers"];
        let source = $("#klipivottab0").attr("source");
        klipivot.setCookie("pivotConfig_" + source, JSON.stringify(config_copy));

        let numRows = parseInt($(pivotTable).attr("data-numrows"));
        let template = [];
        let rows = [];
        let htrs = $(pivotTable).find("thead").find("tr").toArray();
        htrs.forEach(function (htr, ihtr) {
            let hths = $(htr).find("th").toArray();
            if (ihtr === 0) {
                hths.forEach(function (hth, ihth) {
                    let colspan = $(hth).attr("colspan");
                    if (!isNaN(colspan)) {
                        colspan = parseInt(colspan);
                        let classes = $(hth).attr("class");
                        if (typeof classes !== "undefined") {
                            classes = "";
                        }

                        for (let icol = 0; icol < colspan; icol++) {
                            template.push({
                                header: $(hth).html(),
                                html: "",
                                classes: classes,
                                colspantot: colspan,
                                actcolspan: icol + 1,
                                totrowspan: 0,
                                actrowspan: 0
                            });
                        }
                    } else {
                        template.push({
                            header: $(hth).html(),
                            html: "",
                            class: $(hth).attr("class"),
                            colspantot: 0,
                            actcolspan: 0,
                            totrowspan: 0,
                            actrowspan: 0
                        });
                    }
                });
            } else {
                // Folgezeilen, keine colspan mehr erwartet???
                hths.forEach(function (hth, ihth) {
                    // Überschreiben, wenn html vorhanden ist
                    let html = $(hth).html();
                    if (html.length > 0) {
                        template[ihth].header = html;
                    }
                });
            }
        });
        console.log(template);
        let btrs = $(pivotTable).find("tbody").find("tr").toArray();
        let len = btrs.length;
        let skip = false;
        btrs.forEach(function (btr, ibtr) {
            // hier können th oder td vorhanden sein!!!
            let bchilds = $(btr).children().toArray();
            let ichilds = -1;
            let row = [];
            skip = false;
            template.forEach(function (temp, itemp) {
                // hier wird ein Wert "von oben" geholt
                if (temp.totrowspan > 1 && temp.totrowspan > temp.actrowspan) {
                    temp.actrowspan++;
                    row.push(temp.html);
                    return;
                }
                // Hier wird der Wert aus bchild geholt
                ichilds++;
                let bchild = bchilds[ichilds];
                temp.totrowspan = 0;
                temp.actrowspan = 0;
                // hier ist die Spalte genau zu untersuchen
                let rowspan = $(bchild).attr("rowspan");
                let colspan = $(bchild).attr("colspan");
                if (typeof colspan === "undefined" || colspan === null) {} else {
                    let xx = 0;
                    if (!isNaN(colspan) && parseInt(colspan) > 1) {
                        skip = true;
                        return;
                    }
                }
                let html = $(bchild).html();
                if (!isNaN(rowspan)) {
                    rowspan = parseInt(rowspan);
                    if (rowspan === 1) {
                        temp.totrowspan = 1;
                        temp.actrowspan = 1;
                        temp.html = html;
                        row.push(temp.html);
                    } else {
                        temp.totrowspan = rowspan;
                        temp.actrowspan = 1;
                        temp.html = html;
                        row.push(temp.html);
                    }
                } else {
                    // ohne rowspan immer ausgeben
                    temp.totrowspan = 0;
                    temp.actrowspan = 0;
                    temp.html = html;
                    row.push(temp.html);
                }
            });
            if (skip === false) {
                rows.push(row);
            } else {
                console.log("SKIPPED:" + row.join(";"));
            }
        });
        let heads = [];
        template.forEach(function (temp, itemp) {
            heads.push(temp.header);
        });
        console.log(rows);
        return {
            heads: heads,
            records: rows
        };
    };


    /**
     * klipivot.copyToClipboard
     * @param {*} pivotTable 
     */
    klipivot.copyToClipboard = function (pivotTable) {
        let actPivot = klipivot.getPivotRecords(pivotTable);
        let rows = actPivot.records;
        let heads = actPivot.heads;

        // Prepare Header-Line
        let resultstring = "";
        let headerline = "";
        headerline = heads.join(";") + "\r\n";
        resultstring += headerline;
        // Prepare Data-Lines
        rows.forEach(function (row, irow) {
            let dataline = "";
            dataline = row.join(";") + "\r\n";
            resultstring += dataline;
        });
        // Function to copy CSV string to clipboard (modern browsers)
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function () {
                console.log('Copied to clipboard successfully!');
            }, function (err) {
                console.error('Could not copy text: ', err);
            });
        }
        // Call the function to copy the CSV string
        copyToClipboard(resultstring);
    };

    /**
     * l- label => concat, x - X-Achse, hier: Zeit; y - y-Achse, jeweils eine Zeile/Line
     */
    let fieldmapping = {
        "ICOSCO2H": {
            site: "l",
            samplingheight: "l",
            year: "x",
            month: "x",
            day: "x",
            hour: "x",
            minute: "-",
            co2: "y",
            stdev: "y",
            nbpoints: "y",
            flag: "l",
            co2_withoutspikes: "y",
            stdev_withoutspikes: "y",
            totals: "y"
        },
        "ICOSMETH": {
            site: "l",
            samplingheight: "l",
            year: "x",
            month: "x",
            day: "x",
            hour: "x",
            minute: "-",
            ap: "y",
            ap_stdev: "y",
            ap_nbpoints: "y",
            ap_flag: "l",
            at: "y",
            at_stdev: "y",
            at_nbpoints: "y",
            at_flag: "l",
            rh: "y",
            rh_stdev: "y",
            rh_nbpoints: "y",
            rh_flag: "l",
            ws: "y",
            ws_stdev: "y",
            ws_nbpoints: "y",
            ws_flag: "l",
            wd: "y",
            wd_stdev: "y",
            wd_nbpoints: "y",
            wd_flag: "l",
            totals: "y"
        },
        "NOAACO2H": {
            site_code: "l",
            year: "x",
            month: "x",
            day: "x",
            hour: "x",
            minute: "-",
            second: "-",
            datetime: "-",
            time_decimal: "-",
            midpoint_time: "-",
            value: "y",
            value_std_dev: "y",
            value_unc: "y",
            nvalue: "y",
            latitude: "-",
            longitude: "-",
            altitude: "-",
            elevation: "l",
            intake_height: "-",
            instrument: "-",
            qcflag: "y"
        },
        "NOAAMETH": {
            station: "l",
            year: "x",
            month: "x",
            day: "x",
            hour: "x",
            wd: "y",
            ws: "y",
            wsf: "y",
            ap: "y",
            tt60_0002: "y",
            tt60_0010: "y",
            tt60_top: "y",
            rh: "y",
            pi: "y"
        }
    };


    /**
     * klipivot.copyToChart - Ausgabe Graphik mit ChartJS
     * @param {*} pivotTable 
     */
    klipivot.copyToChart = function (pivotTable) {
        let source = $("#klipivottab0").attr("source");
        let actPivot = klipivot.getPivotRecords(pivotTable);
        let rows = actPivot.records; // rows ist ein array von row-arrays, also erst konvertieren zu records
        let heads = actPivot.heads;
        // jetzt data aufbauen mit labels und datasets aufbereiten!!!
        // cconfig.data.labels - xlabels
        // cconfig.data.datasets mit {} mit label, data[] entsprechend xlabels, dazu dann Attribute
        let headcontrol = {};
        let newheads = [];
        let newnames = [];

        heads.forEach(function (head, ihead) {
            let oldhead = head;
            let newhead = head.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            newnames.push(newhead);
            newheads.push(newhead); // neue Führungsdatei!
            headcontrol[newhead] = {
                ind: ihead,
                head: newhead,
                oldhead: oldhead,
            };
        });

        // Transformation headcontrol und rows zu records
        let records = [];
        rows.forEach(function (row, irow) {
            let record = {};
            row.forEach(function (field, ifield) {
                record[newnames[ifield]] = field;
            });
            records.push(record);
        });

        // Aufbau der x-Metadaten
        let newxfields = [];
        newheads.forEach(function (newhead, inewhead) {
            let ftyp = fieldmapping[source][newhead];
            if (typeof ftyp === "string" && ftyp === "x") {
                newxfields.push(newhead);
            }
        });

        // Aufbau der y-Metadaten (eigentlich nur die y-Label-Prefixe)
        let newyfields = []; // genauer: y-labels
        newheads.forEach(function (newhead, inewhead) {
            let ftyp = fieldmapping[source][newhead];
            if (typeof ftyp === "string" && ftyp === "l") {
                newyfields.push(newhead);
            }
        });

        // Aufbau der Line-Metadaten
        let linefields = []; // genauer: y-label-Suffix und somit die eigentliche Variable
        newheads.forEach(function (newhead, inewhead) {
            let ftyp = fieldmapping[source][newhead];
            if (typeof ftyp === "string" && ftyp === "y") {
                linefields.push(newhead);
            }
        });

        // Aufbau des x-Vektors
        let xcontrol = {};
        let xlabels = [];

        let ycontrol = {};
        let ylabels = [];

        records.forEach(function (record, irec) {
            let xlabel = [];
            newxfields.forEach(function (field, ifield) {
                xlabel.push(record[field]);
            });
            xlabel = xlabel.join("-");
            if (typeof xcontrol[xlabel] === "undefined") {
                xcontrol[xlabel] = xlabel;
            }
            record.xlabel = xlabel;

            let ylabel = [];
            newyfields.forEach(function (field, ifield) {
                ylabel.push(record[field]);
            });
            ylabel = ylabel.join("-");
            if (typeof ycontrol[ylabel] === "undefined") {
                ycontrol[ylabel] = ylabel;
            }
            record.ylabel = ylabel;
        });
        /*
        console.log("newxfields");
        console.log(newxfields);
        console.log("newyfields");
        console.log(newyfields);
        console.log("xcontrol");
        console.log(xcontrol);
        console.log("ycontrol");
        console.log(ycontrol);
        */

        // Aufbau der xlabels für die x-Achse
        // xcontrol[xlabel] => xlabels
        xlabels = Object.keys(xcontrol);
        let anzcols = xlabels.length;
        let datacontrol = {};
        records.forEach(function (record, irec) {
            let xlabel = record.xlabel;
            let xindex = xlabels.indexOf(xlabel);
            linefields.forEach(function (variable, ivariable) {
                let ylabel = record.ylabel + "_" + variable;
                if (typeof datacontrol[ylabel] === "undefined") {
                    datacontrol[ylabel] = {
                        label: ylabel,
                        variable: variable,
                        data: new Array(anzcols).fill(null)
                    }
                }
                datacontrol[ylabel].data[xindex] = record[variable];
            });
        });
        console.log(datacontrol);
        // sieht alles gut aus, daher: Ausgabe
        klipivot.showChart(datacontrol, xlabels);

    };

    let colorlist = [
        "#FF0000", // Red
        "#00FF00", // Lime
        "#0000FF", // Blue
        "#FFFF00", // Yellow
        "#00FFFF", // Cyan
        "#FF00FF", // Magenta
        "#800080", // Purple
        "#008000", // Green
        "#000080", // Navy
        "#800000", // Maroon
        "#008080", // Teal
        "#808000", // Olive
        "#C0C0C0", // Silver
        "#808080", // Gray
        "#FF8080", // Light Red
        "#80FF80", // Light Green
        "#8080FF", // Light Blue
        "#FFFF80", // Light Yellow
        "#80FFFF", // Light Cyan
        "#FF80FF", // Light Magenta
        "#FF0080", // Pink
        "#00FF80", // Mint
        "#8000FF", // Violet
        "#80FF00", // Chartreuse
        "#0080FF", // Azure
        "#FF8000", // Orange
        "#8080C0", // Lavender
        "#C080C0", // Plum
        "#C0C080", // Khaki
        "#80C0C0" // Aquamarine
    ];


    /**
     * klipivot.showChart - Aufbereiten config mit options aus datacontrol und xlabels
     * Ausgabe nach
     * @param {*} datacontrol 
     * @param {*} xlabels 
     */
    klipivot.showChart = function (datacontrol, xlabels) {
        $("#klipivottab3").children().remove();
        $("#klipivottab3")
            .append($("<div/>", {
                css: {
                    "margin": "10px",
                    "background-color": "lightsteelblue"
                },
                id: "klipivotchartbuttons"
            }))
            .append($("<canvas/>", {
                id: "klipivotchart"
            }));

        $("#klipivotrawbuttons")
            .append($("<form/>")
                .append($("<button/>", {
                    class: "btn btn-secondary",
                    text: "Reset",
                    title: "Rücksetzen der Hervorhebung der Treffer",
                    click: function (evt) {
                        evt.preventDefault();
                        myHilitor.remove();
                    }
                }))
            );

        let cconfig = {
            type: "line",
            data: {},
            options: {
                plugins: {
                    title: {
                        text: "Chart zu Pivotdaten",
                        font: {
                            weight: "bold"
                        }
                    },
                },
                scales: {
                    x: {
                        axis: "x",
                        display: true,
                        title: {
                            text: "Zeitachse",
                            display: true
                        }
                    }
                },
            }
        };
        cconfig.data.labels = xlabels;
        cconfig.data.datasets = [];
        //datacontrol[ylabel]
        Object.keys(datacontrol).forEach(function (label, ilabel) {
            let dataset = {};
            let record = datacontrol[label];
            dataset.variable = record.variable;
            dataset.label = record.label;
            dataset.data = [];
            const regex = /-9(?:\.|,)?9+(?:\.\d+)?/;
            record.data.forEach(function (value, ival) {
                if (typeof value === "string" && regex.test(value)) {
                    value = null;
                } else if (typeof value === "undefined" || value === null) {
                    value = null;
                } else if (typeof value === "string" && !isNaN(value)) {
                    value = parseFloat(value)
                } else if (typeof value === "number") {
                    // value bleibt
                } else {
                    value = null;
                }
                dataset.data.push(value);
            });
            let color = colorlist[ilabel];
            dataset.backgroundColor = color; //"red";
            dataset.borderColor = color; // "red";
            dataset.fill = false;
            dataset.pointRadius = 0;
            dataset.yAxisID = record.variable;
            /*            
            scales: 
            CO2H: 
            axis: "y"
            display: "auto"
            id: "CO2H"
            title: 
                display: "auto"
                text: "CO2H"
            */
            if (typeof cconfig.options.scales === "undefined") {
                cconfig.options.scales = {};
            }
            if (typeof cconfig.options.scales[dataset.yAxisID] === "undefined") {
                cconfig.options.scales[dataset.yAxisID] = {
                    axis: "y",
                    display: "auto",
                    title: {
                        text: record.variable,
                        display: true
                    },
                    //dimension: record.variable,
                    //minvalue: null,
                    //maxvalue: null
                };
            }
            dataset.tension = 0.4;
            dataset.bullets = false;
            dataset.spangaps = false;
            cconfig.data.datasets.push(dataset);
        });

        // brutale Testausgabe 
        let canvas = document.getElementById("klipivotchart");
        let ctx = canvas.getContext("2d");
        let graph = new Chart(ctx, cconfig);
        $("#klipivotbut3").trigger("click");
    };

    /**
     * klipivot.getCookie - Cookie-String mit name holen
     * @param {*} name 
     * @returns string oder null, wenn der Cookie noch nicht bekannt ist
     */
    klipivot.getCookie = function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    // Example usage
    // var storedString = getCookie('myString');
    // console.log(storedString); // Output: "This is a sample string"

    /**
     * klipivot.setCookie - Cookie-String setzen
     * @param {*} name 
     * @param {*} value 
     * @param {*} days - ist optional, "ewig" wenn nicht gesetzt
     */
    klipivot.setCookie = function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    // Example usage
    // setCookie('myString', 'This is a sample string', 30); // Stores the string for 30 days



    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = klipivot;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return klipivot;
        });
    } else {
        // included directly via <script> tag
        root.klipivot = klipivot;
    }
}());