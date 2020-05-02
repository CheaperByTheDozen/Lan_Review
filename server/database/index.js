const { Client } = require('pg');

const client = new Client({
  user: 'whisly',
  port: 5432,
  database: 'reviews',
});

client.connect((err) => {
  if (err) {
    console.log('Error from connecting to postgreSQL db :', err);
  } else {
    console.log('Connected to PostGreSQL ');
  }
});

// helper function to organize data, each page will have only 6 reviews
const formatData = (data, count) => {
  const pageCount = Math.ceil(count / 6);
  const response = {
    pageCount,
    pages: [],
  };
  for (let i = 1; i <= pageCount; i += 1) {
    const page = {
      page: i,
      reviews: [],
    };
    response.pages.push(page);
  }

  let currentPage = 0;
  let pushedCount = 0;
  for (let i = 0; i < data.length; i += 1) {
    response.pages[currentPage].reviews.push(data[i]);
    pushedCount += 1;
    if (pushedCount === 6) {
      currentPage += 1;
      pushedCount = 0;
    }
  }
  return response;
};

const fetchReviews = (param, res) => {
  const sql = `SELECT * FROM reviews where roomId = ${param} ORDER BY datePublished desc`;
  client.query(sql, (err, result) => {
    if (err) {
      console.log('Error fetching data from pgsl : ', err);
    } else {
      const formattedData = formatData(result.rows, result.rowCount);
      res.status(200).send(formattedData);
    }
  });
};

const searchReviews = (roomID, phrase, res) => {
  const sql = `SELECT reviews.id, users.firstName, users.lastName, users.username, users.avatar,
               rooms.roomIdentification, reviews.datePublished, reviews.comment, reviews.checkinRating,
               reviews.accuracyRating, reviews.valueRating, reviews.communicationRating,
               reviews.cleanlinessRating, reviews.locationRating
               FROM reviews, users, rooms
               WHERE roomId = ${roomID} AND reviews.userId = users.id AND reviews.roomId = rooms.id AND reviews.comment ~* '.*${phrase}.*'
               ORDER BY datePublished desc;`;
  client.query(sql, (err, result) => {
    if (err) {
      console.log('Error searching reviews from pgsl : ', err);
      res.status(500).send(err);
    } else {
      const formattedData = formatData(result.rows, result.rowCount);
      res.status(200).send(formattedData);
    }
  });
};

module.exports.client = client;
module.exports.fetchReviews = fetchReviews;
module.exports.searchReviews = searchReviews;
