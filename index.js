const PORT = 8000;
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const app = express();

const csvHeaders = [
  { id: "title", title: "Title" },
  { id: "vodServiceName", title: "VOD service name" },
  { id: "rating", title: "Rating" },
];

const csvWriter = createCsvWriter({
  path: "./films.csv",
  header: csvHeaders,
  fieldDelimiter: ",",
});

const baseUrl = "https://www.filmweb.pl/ranking/vod";

const HBO = { path: "hbo_max", name: "HBO MAX" };
const netflix = { path: "netflix", name: "NETFLIX" };
const canalPlus = { path: "canal_plus_manual", name: "CANAL+" };
const disney = { path: "disney", name: "DISNEY+" };

const currentYear = "2023"; // Tu jeszcze moge zrobić,żeby ściągało zawsze najnowszy rok

const getFilms = (baseUrl, vodService, year) => {
  const url = `${baseUrl}/${vodService.path}/film/${currentYear}`;
  axios(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      const films = [];
      let counter = 0;
      $(".rankingType__card", html).each(function () {
        if (counter === 10) return false;
        const title = $(this).find("h2").text();
        const rating = $(this).find(".rankingType__rate--value").text();
        films.push({ title, rating, vodServiceName: vodService.name });
        counter++;
      });
      console.log(films);

      csvWriter
        .writeRecords(films) // returns a promise
        .then(() => {
          console.log("...Done");
        });
    })
    .catch((err) => console.log(err));
};

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

getFilms(baseUrl, disney, currentYear);