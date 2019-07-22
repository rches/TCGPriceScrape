const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const request = require("request");

const app = express();

app.use(cors());

app.use(morgan("tiny"));

function getResultsMarket(body) {
  const $ = cheerio.load(body);
  const productMarket = $(".itemContentWrapper");
  const resultsMarket = [];

  productMarket.each((i, element) => {
    const result = $(element);
    const name = result.find(".productDetailTitle").text();
    const setName = result.find(".productDetailSet").text();
    const marketDollar = result.find(".stylePrice").text();
    const marketDollarFormatted = marketDollar.split("\n");

    resultsMarket.push({
      name,
      setName,
      marketDollarFormatted
    });
  });
  return { resultsMarket: resultsMarket };
}

function getResultsBuy(body) {
  const $ = cheerio.load(body);
  const productBuy = $("li.productItemWrapper");
  const resultsBuy = [];

  function formatted(money) {
    const sliceAndDice =
      money.slice(1, money.length - 2) +
      "." +
      money.slice(money.length - 2, money.length);
    return parseFloat(sliceAndDice);
  }

  productBuy.each((i, element) => {
    const result = $(element);
    const name = result.find(".productDetailTitle").text();
    const sellDollar = result.find(".usdSellPrice").text();
    const sellCredit = result.find(".creditSellPrice").text();
    const setName = result.find(".productDetailSet").text();
    // setName.replace("\\n", "");
    const sellDollarFormatted = formatted(sellDollar);
    const sellCreditFormatted = formatted(sellCredit);

    resultsBuy.push({
      name,
      setName,
      sellDollarFormatted,
      sellCreditFormatted
    });
  });

  return { resultsBuy };
}

app.get("/", (request, response) => {
  response.json({
    message: "All Systems, GO!"
  });
});

app.get("/search/:cardName", (request, response) => {
  const cardName = request.params.cardName;
  const buyListURL = `https://www.cardkingdom.com/purchasing/mtg_singles?filter%5Bsearch%5D=mtg_advanced&filter%5Bname%5D=${cardName}`;
  const marketURL = `https://www.cardkingdom.com/catalog/search?search=header&ac=1&filter%5Bname%5D=${cardName}`;
  const urls = [buyListURL, marketURL];

  return Promise.all(urls.map(url => fetch(url)))
    .then(responses => Promise.all(responses.map(response => response.text())))
    .then(body => {
      const buyData = getResultsBuy(body[0]);
      const marketData = getResultsMarket(body[1]);

      response.json({
        buyData,
        marketData
      });
    })
    .catch(error => console.log("We have issues: ", error));

  //find the first value in sell dollar formatted

  //find the first value in market dollar formatted

  //do the spread math

  //return information on spread
});

app.use((request, response, next) => {
  const error = new Error("Not found");
  response.status(404);
  next(error);
});

app.use((error, request, response, next) => {
  response.status(response.statusCode || 500);
  response.json({
    message: error.message
  });
});

app.listen(8080, () => {
  console.log("listening on port 8080");
});
