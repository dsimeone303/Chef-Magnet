const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const axios = require("axios"); //used for making HTTP request
const cheerio = require("cheerio"); // parsing HTML
const app = express();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "chefmagnet",
  database: "chefMagnetDB"
});



async function scrapeMexicoInMyKitchen(url, qualityCheck) {
  con
    try {
      
      //all the normal stuff
      const response = await axios.get(url);

      const html = response.data;
      const $ = cheerio.load(html);

      $(".feast-catagory-index-list").each((index, element) => {
        
        
      let imageLink = '';
      let textContent='';
      let link='';
      let main_url = '';
      let main_logo='';
      let meal_type='';
      let cousine='';
      let protein= '';
        //getting link url:
        let anchors = $(element).querySelector('a')
        const href = anchor[0].attr('href')
        link = href;

        //get textContent aka TItle
        let titles = $(element).querySelector('.fsri-title');
        let title = titles[0].innerText
        textContents = title;

        
        //get image URL
        const img = $(element).querySelector('img');
           let href2 = img.attr('data-lazy-src');
           if (href2 === null) {
             href2 = img.attr("src");
          }
            imageLink = href;
        
               main_logo =
        "https://www.mexicoinmykitchen.com/wp-content/uploads/2022/08/logo-mimkb-200-p.svg";
      // main url
      main_url = "https://www.mexicoinmykitchen.com"
        
        //add inputs to quality check object array:
        let checker = {
          "imageLink": imageLink,
          "title": textContent,
          "link": link,
          "mainURL": main_url,
          "main_logo": main_logo,
          "meal_type": meal_type,
          "cousine": cousine,
          "protein": protein
        }
        qualityCheck.push(checker);
        
      });
      

      //scrapting catagory


      //scraping for images
      $(".wp-post-image").each((index, element) => {
        let href = $(element).attr("data-lazy-src");
        if (href === null) {
          href = $(element).attr("src");
        } //change to what ever the attribute the image uses
        imageLink = href; 
      });

      //check if there's another page
      const nextPageLink = $(".next").attr("href");
      if (nextPageLink) {
        const nextPageURL = new URL(nextPageLink, url).toString();
        await scrapeMexicoInMyKitchen(nextPageURL);
      }
      
      
    } catch (error) {
      console.error(error);
      //error
      //   .status(500)
      //   .json({ error: "An error occurred while scraping the website." });
    }
  }

//this needs to bet a
router.get("/scrape", async (req, res) => {
  // need to create a for each statement, where the URL goes through and pulls each recipe per page. and per catagory aka catagory/ maindish.... catagor/app/page1,2,3

  try {
    let qualityCheck = [
];
    const websites = [
      "https://www.mexicoinmykitchen.com/antojitos/"
    ]; /*,
                     'https://www.mexicoinmykitchen.com/appetizers/',
                     'https://www.mexicoinmykitchen.com/basic-recipes/',
                     'https://www.mexicoinmykitchen.com/beef/',
                     'https://www.mexicoinmykitchen.com/breakfast/',
                     'https://www.mexicoinmykitchen.com/chicken/',
                      'https://www.mexicoinmykitchen.com/drinks/',
                      'https://www.mexicoinmykitchen.com/desserts/',
                      'https://www.mexicoinmykitchen.com/salads/',
                      'https://www.mexicoinmykitchen.com/side-dish/',
                      'https://www.mexicoinmykitchen.com/soups/',
                      'https://www.mexicoinmykitchen.com/stews/',
                      'https://www.mexicoinmykitchen.com/pork/',
                      'https://www.mexicoinmykitchen.com/salsas/',
                      'https://www.mexicoinmykitchen.com/seafood/',
                      'https://www.mexicoinmykitchen.com/tacos/',
                      'https://www.mexicoinmykitchen.com/tamales/'
                     ]*/
    for (const website of websites) {
      let starturl = website;
      await scrapeMexicoInMyKitchen(starturl,qualityCheck);
    }
    res.json({
      //data: [imageLinks, textContents, link, main_url, cousine, meal_type]
      data:[qualityCheck]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "an error occured" });
  }
});


module.exports = router;
