$.ajaxPrefilter(function (options) {
  if (options.crossDomain && jQuery.support.cors) {
    const http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
    options.data = options.data.replace(/%2B/gm, '+');
  }
});

let app = {
  el: '#app',
  data: {
    q: 'ingénieur informatique',
    results: [],
    companies:{},
    companiesFull:{},
  },
  methods: {
    query: (event, page = 0) => {
      if (page === 0) {
        app.results = [];
        app.companies = {};
      }
      $.ajax({
        type: 'GET',
        url: 'http://api.indeed.com/ads/apisearch',
        data: {
          'v': '2',
          'format': 'json',
          'userip': '1.2.3.4',
          'useragent': 'Mozilla//4.0(Firefox)',
          'jt': 'fulltime',
          'co': 'fr',
          'limit': 10,
          'start': page * 10,
          'filter': 'false',
          'q': app.q,
          'l': 'Nantes+(44)',
          'publisher': '1303284387458115',
        },
        success: (res) => {
          app.results.push(...res.results);
          res.results.forEach(r=>{
            app.companies[r.company] = (app.companies[r.company] || 0) + 1;
          });
          if (res.end < res.totalResults) {
            app.query(null, page + 1);
          }else{
            app.results.sort((r1,r2) => app.companies[r1.company] - app.companies[r2.company]);
            app.companiesFull = {};
            Object.keys(app.companies).forEach(name => {
              app.queryCompany(name);
            });
          }
        }
      });
    },
    queryCompany:(name)=>{
      $.ajax({
        type: 'GET',
        url: 'http://api.indeed.com/ads/apisearch',
        data: {
          'v': '2',
          'format': 'json',
          'userip': '1.2.3.4',
          'useragent': 'Mozilla//4.0(Firefox)',
          'jt': 'fulltime',
          'co': 'fr',
          'filter': 'false',
          'q': name,
          'publisher': '1303284387458115',
        },
        success: (res) => {
          app.companiesFull[name] = res.totalResults;
          if(Object.keys(app.companies).length === Object.keys(app.companiesFull).length){
            app.results.sort((r1,r2) => app.companiesFull[r1.company] - app.companiesFull[r2.company]);
          }
          app['$forceUpdate']();
        }
      });
    }
  },
  'mounted': () => {

  },
};

$(document).ready(function () {
  app = new Vue(app);
});