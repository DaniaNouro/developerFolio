const fs = require("fs");
const https = require("https");
require("dotenv").config();

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const USE_GITHUB_DATA = process.env.USE_GITHUB_DATA;
const MEDIUM_USERNAME = process.env.MEDIUM_USERNAME;

const ERR = {
  noUserName:
    "Github Username was found to be undefined. Please set all relevant environment variables.",
  requestFailed:
    "The request to GitHub didn't succeed. Check if GitHub token in your .env file is correct.",
  requestMediumFailed:
    "The request to Medium didn't succeed. Continuing without Medium posts."
};

// GitHub fetch
if (USE_GITHUB_DATA === "true") {
  if (!GITHUB_USERNAME) {
    throw new Error(ERR.noUserName);
  }

  console.log(`Fetching profile data for ${GITHUB_USERNAME}`);

  const data = JSON.stringify({
    query: `
    {
      user(login:"${GITHUB_USERNAME}") { 
        name
        bio
        avatarUrl
        location
        pinnedItems(first: 6, types: [REPOSITORY]) {
          totalCount
          edges {
              node {
                ... on Repository {
                  name
                  description
                  forkCount
                  stargazers {
                    totalCount
                  }
                  url
                  id
                  diskUsage
                  primaryLanguage {
                    name
                    color
                  }
                }
              }
            }
          }
        }
    }
    `
  });

  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    port: 443,
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "Node"
    }
  };

  const req = https.request(options, res => {
    let profileData = "";

    console.log(`GitHub statusCode: ${res.statusCode}`);

    res.on("data", d => {
      profileData += d;
    });

    res.on("end", () => {
      fs.writeFile("./public/profile.json", profileData, err => {
        if (err) return console.log(err);
        console.log("saved file to public/profile.json");
      });
    });
  });

  req.on("error", error => {
    console.warn("GitHub fetch error:", error);
  });

  req.write(data);
  req.end();
}

// Medium fetch
if (MEDIUM_USERNAME && MEDIUM_USERNAME.trim() !== "") {
  console.log(`Fetching Medium blogs data for ${MEDIUM_USERNAME}`);

  const options = {
    hostname: "api.rss2json.com",
    path: `/v1/api.json?rss_url=https://medium.com/feed/@${MEDIUM_USERNAME}`,
    port: 443,
    method: "GET"
  };

  const req = https.request(options, res => {
    let mediumData = "";

    console.log(`Medium statusCode: ${res.statusCode}`);

    res.on("data", d => {
      mediumData += d;
    });

    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.warn(`${ERR.requestMediumFailed} (status ${res.statusCode})`);
        // fallback فارغ
        fs.writeFileSync("public/blogs.json", JSON.stringify([]), "utf8");
      } else {
        fs.writeFile("public/blogs.json", mediumData, err => {
          if (err) return console.log(err);
          console.log("saved file to public/blogs.json");
        });
      }
    });
  });

  req.on("error", error => {
    console.warn("Medium fetch error:", error);
    fs.writeFileSync("public/blogs.json", JSON.stringify([]), "utf8");
  });

  req.end();
} else {
  console.log("No MEDIUM_USERNAME provided — skipping Medium fetch.");
  fs.writeFileSync("public/blogs.json", JSON.stringify([]), "utf8");
}
