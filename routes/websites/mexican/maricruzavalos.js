const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const axios = require("axios"); //used for making HTTP request
const cheerio = require("cheerio"); // parsing HTML
const app = express();
const mysql = require("mysql2");

async function scrapeMaricruzavalos(url, dataQualityCheck) {
  try {
    //all the normal stuff
    let response = await axios.get(url);
    let html = response.data;
    let $ = cheerio.load(html);

    //lets try to find everything on one .each

    $(".content-bg").each((index, element) => {
      let imageLink = ""; //check
      let textContent = ""; //check
      let link = ""; //check
      let main_url = "https://www.maricruzavalos.com/"; //fill in
      let main_logo =
        "https://www.maricruzavalos.com/wp-content/uploads/2023/09/newmarylogo.png"; // fill in
      let meal_type = [];
      let cuisine = "mexican"; //done
      let protein = []; //done
      const elementChildren = $(element).contents();

      //aquire link: //fixed

      link = elementChildren.filter(".post-thumbnail").attr("href");

      //aquire title: //fixed
      textContent = elementChildren
        .find(".entry-title")
        .children("a")
        .text();

      //aquire image:
      let href = elementChildren.find(".wp-post-image").attr("data-lazy-src");
      if (href === null) {
        href = $(".wp-post-image").attr("src");
      }
      imageLink = href;

      //protein
      //this one is going to go off the tag names in the elements(artcle) and pick which one it is.
      let entryClass = $(element).attr("class");
      entryClass = entryClass.toString();
      if (entryClass.includes("tag-fish-and-seafood")) {
        protein.push("fish-and-seafood");
      }
      if (entryClass.includes("tag-chicken")) {
        protein.push("poultry");
      }
      if (entryClass.includes("tag-beef")) {
        protein.push("beef");
      }
      if (entryClass.includes("tag-pork")) {
        protein.push("pork");
      }
      if (entryClass.includes("tag-vegetarian")) {
        protein.push("vegi");
      }
      if (protein === []) {
        protein.push("empty");
      }
      //turkey doesn't have an indication of the catagory
      //do a if has turkey in the name then it's prolly fuckin turkey.

      //mealtype
      //using entryClass from above
      if (entryClass.includes("category-main-dish")) {
        meal_type.push("main");
      }
      if (entryClass.includes("category-soups")) {
        meal_type.push("app", "soup");
      }
      if (entryClass.includes("category-side-dish")) {
        meal_type.push("side");
      }
      if (entryClass.includes("category-salads")) {
        meal_type.push("salad");
      }
      if (entryClass.includes("category-drinks")) {
        meal_type.push("drink");
      }
      if (entryClass.includes("category-desserts")) {
        meal_type.push("dessert");
      }
      if (meal_type === undefined) {
        console.log("no meal type");
      }

      //end of the road for this recipe, place all contents into quality check:
      let newRecipe = {
        imageLink: imageLink,
        title: textContent,
        link: link,
        mainURL: main_url,
        mainLogo: main_logo,
        mealType: meal_type,
        cuisine: cuisine,
        protein: protein
      };
      //console.log(newRecipe);

      dataQualityCheck.push(newRecipe);
    });

    //check if there's another page
    const nextPageLink = $(".next").attr("href");
    if (nextPageLink) {
      const nextPageURL = new URL(nextPageLink, url).toString();
      await scrapeMaricruzavalos(nextPageURL, dataQualityCheck);
    }
  } catch (error) {
    console.error("The Cheerio error  " + error);
    error;
    //.status(500)
    //.json({ error: "An error occurred while scraping the website." });
  }
}

async function Datalogging(dataQualityCheck) {
  //sql connection
  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "chefmagnet",
    database: "chefMagnetDB"
  });
  connection.connect(err => {
    if (err) {
      console.log("error connectiong to Mysql: ", err);
      throw err;
    }
  });

  
  let mainU = dataQualityCheck[0].mainURL;
  let initiate = new Promise((resolve, reject) => {
    //first step get the all_recipes table:
    let dataRetreival = `SELECT * FROM all_recipes WHERE main_url = '${mainU}'`;
    let dataArray = [];
    //step 1: create a query connection and aquire existing data associated with the selected site (Via main_url)
    connection.query(dataRetreival, (err, results) => {
      if (err) {
        console.error("Error Executing Query 1: ", err);
        throw err;
      }
      results.forEach(row => {
        dataArray.push(row);
      });
      console.log(dataArray.length);
      resolve(dataArray);
    });
  });

  initiate
    .then(dataArray => {
      let unique = dataQualityCheck.filter(
        (value, index) => dataQualityCheck.indexOf(value) === index
      );
      let output = [dataArray, unique];
      return output;
    })
    .catch(error => {
      console.log("first thenable Error: " + error);
    })
    .then(
      info => {
        //need to add different varaible to be able to check all other variables.
        let dataArray = info[0];
        let dataCheck = info[1];
        let dataQnum = [];
        let existing_p = [];
        for (let i = 0; i < dataCheck.length; i++) {
          let dataAnum = [];
          let Existing_p = [];
          for (let j = 0; j < dataArray.length; j++) {
            if (
              JSON.stringify(dataCheck[i].link) ==
              JSON.stringify(dataArray[j].url)
            ) {
              //console.log('we got a match');
              dataAnum.push(dataArray[j]);
              dataQnum.push(dataCheck[i]);
            }
            /*
           if (JSON.stringify(dataCheck[i].protein) == JSON.stringify(ProteinDA[j].proteins)) {
              existing_p.push(dataCheck[i]);
            }
            */
          }
          //issue: removing 1 recipe where that 1 recipe might have been picked up in different catagories, as for now it's been cancelled
          // for (let j = 0; j < dataAnum.length; j++) {
          //  dataArray.splice(dataAnum[j], 1);
          // }
          //if no links removed this should be: []
          //console.log(dataArray);
        }

        // proteins

        for (let i = 0; i < dataQnum.length; i++) {
          const indy = dataCheck.indexOf(dataQnum[i]);
          dataCheck.splice(indy, 1);
        }
        //protein
        
        let results = [dataCheck, dataArray];
        return results;
      },
      error => {
        console.error(
          "Error while checking database vs new information: " + error
        );
      }
    )
    .then(
      value => {
        let dataCheck = value[0];

        //when the link in the database doesn't exist on the website anymore, remove it
        let dataArray = value[1];

        dataCheck.forEach(datas => {
          let recipeSubmission =
            `INSERT INTO all_recipes (title, url, photo_url, main_url, main_logo_url, cuisine) VALUES('` +
            datas.title +
            "' , '" +
            datas.link +
            "' , '" +
            datas.imageLink +
            "' , '" +
            datas.mainURL +
            "' , '" +
            datas.mainLogo +
            " ', '" +
            datas.cuisine +
            `');`;
          connection.query(recipeSubmission, (error, results) => {
            if (error) {
              console.error(
                "Error Executing Query recipe Submission: ",
                error.message
              );
              throw error;
            }
          });
        });
        return dataCheck;
      },
      error => {
        console.log("failed on catagorizing data" + error);
      }
    )
    .then(
      value => {
        value.forEach(datas => {
          if (datas.mealType === true) {
            datas.mealType.forEach(mealTypeInsert => {
              let mealTypeSubmission =
                "INSERT INTO recipe_meal_types (parent_url, meal_types) VALUES(" +
                datas.link +
                "," +
                mealTypeInsert +
                ");";
              /*
          connection.query(mealTypeSubmission, (error, results) => {
            if (error) {
              console.error("error Executing Query MealType: ", error);
              throw error;
            }
          });
          */
            });
          } else {
            let theWorld = "know nothing";
            //console.log("this one aint truthy")
          }
        });

        return value;
      },
      error => {
        console.log("failed logging whole recipe: " + error);
      }
    )
    .then(value => {
      value.forEach(datas => {
        if (datas.protein === true) {
          datas.protein.forEach(proteinInsert => {
            let proteinSubmission =
              "INSERT INTO recipe_proteins (parent_url, proteins) VALUES(" +
              datas.link +
              "," +
              proteinInsert +
              ");";
            /*
          connection.query(proteinSubmission, (error, results) => {
            if (error) {
              console.error("error Executing Query Proteins: ", error);
              throw error;
            }
          });
          */
          });
        }
      });
    })
    .then(() => {
      const endConnect = connection.end(err => {
        if (err) {
          console.error("error closing Mysql");
          throw err;
        }
        //console.log("logged out of MYSQL");
      });
    });
}

// loading http://localhost:3000/websites/mexican/maricruzavalos
router.get("/", async (req, res) => {
  try {
    //create object array to hold scraped data
    let dataQualityCheck = [];

    //array to flip through different catagories on site
    let mealTypes = [
      "https://www.maricruzavalos.com/category/mexican-recipes/main-dish/",
      "https://www.maricruzavalos.com/category/mexican-recipes/side-dish/",
      "https://www.maricruzavalos.com/category/mexican-recipes/breakfast/",
      "https://www.maricruzavalos.com/category/mexican-recipes/desserts/"
    ];
    //per website web scrape
    for (const website of mealTypes) {
      let starturl = website;
      //async function to complete scrape
      await scrapeMaricruzavalos(starturl, dataQualityCheck);
    }
    //function to add new recipes to database
    Datalogging(dataQualityCheck);
    //simple display json results to page
    res.json({
      data: [dataQualityCheck]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "an error occured" });
  }

  //function to add new recipes to database
});

//retreive data from existing tables:

module.exports = router;
