const PORT = 7000;
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

const vodServicesArray = [HBO, netflix, canalPlus, disney];

const currentDate = new Date();
const currentYear = currentDate.getFullYear().toString();

const getFilms = (baseUrl, vodService, year) => {
  const url = `${baseUrl}/${vodService.path}/film/${currentYear}`;
  return axios(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      const films = [];
      let counter = 0;
      $(".rankingType__card", html).each(function () {
        if (counter === 10) return false;
        const title = $(this).find("h2").text();
        const rating = $(this).find(".rankingType__rate--value").text();
        films.push({
          title: title,
          rating: rating,
          vodServiceName: vodService.name,
        });
        counter++;
      });
      return films;
    })
    .catch((err) => console.log(err));
};

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

const promises = vodServicesArray.map((vodService) => {
  return getFilms(baseUrl, vodService, currentYear);
});

const deduplicateFilms = (films) => {
  const filmTitleObj = {};
  films.forEach((film) => {
    const { title } = film;
    if (filmTitleObj.hasOwnProperty(title)) {
      const existingFilm = filmTitleObj[title];
      if (film.rating > existingFilm.rating) {
        filmTitleObj[title] = film;
      }
    } else {
      filmTitleObj[title] = film;
    }
  });
  const uniqueFilms = Object.values(filmTitleObj);
  return uniqueFilms;
};

Promise.all(promises)
  .then((results) => {
    const scrapedFilms = results.flat();
    return scrapedFilms;
  })
  .then((scrapedFilms) => {
    const deduplicatedFilms = deduplicateFilms(scrapedFilms);
    const sortedFilms = deduplicatedFilms.sort((a, b) => {
      return (
        parseFloat(b.rating.replace(",", ".")) -
        parseFloat(a.rating.replace(",", "."))
      );
    });
    console.log(sortedFilms);
    return csvWriter.writeRecords(sortedFilms);
  })
  .then(() => {
    console.log("Success: Films saved to films.csv file");
  })
  .catch((err) => console.log(err));
