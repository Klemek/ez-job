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
    error: null,
    requests: 0,
    q: 'ingénieur informatique',
    co : 'fr',
    l:'Nantes (44)',
    results: [],
    companies:{},
    companiesFull: Cookies.getJSON('companiesFull') || {},
  },
  methods: {
    query: (event, page = 0) => {
      if (page === 0) {
        app.results = [];
        app.companies = {};
        app.requests = 0;
        app.error = null;
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
          'co': app.co,
          'limit': 25,
          'start': page * 25,
          'filter': 'false',
          'q': app.q,
          'l': app.l,
          'publisher': '1303284387458115'
        },
        success: (res) => {
          app.requests++;
          app.results.push(...res.results);
          res.results.forEach(r=>{
            app.companies[r.company] = (app.companies[r.company] || 0) + 1;
          });
          if (res.end < res.totalResults) {
            app.query(null, page + 1);
          }else{
            if(app.companiesQueried()){
              app.results.sort((r1,r2) => app.companiesFull[r1.company] - app.companiesFull[r2.company]);
            }else{
              app.results.sort((r1,r2) => app.companies[r1.company] - app.companies[r2.company]);
              Object.keys(app.companies).forEach(name => {
                app.queryCompany(name);
              });
            }
            
          }
        },
        error: (error) => {
          console.error(error);
          app.error = error.statusText;
        }
      });
    },
    companiesQueried: () => {
      let res = true;
      Object.keys(app.companies).forEach(name => {
        if(!app.companiesFull[name])
          res = false;
      });
      return res;
    },
    queryCompany:(name)=>{
      if(app.companiesFull[name])
        return;
      $.ajax({
        type: 'GET',
        url: 'http://api.indeed.com/ads/apisearch',
        data: {
          'v': '2',
          'format': 'json',
          'userip': '1.2.3.4',
          'useragent': 'Mozilla//4.0(Firefox)',
          'co': app.co,
          'filter': 'false',
          'limit': 1,
          'q': name,
          'publisher': '1303284387458115'
        },
        success: (res) => {
          app.requests++;
          app.companiesFull[name] = res.totalResults;
          if(app.companiesQueried()){
            app.results.sort((r1,r2) => app.companiesFull[r1.company] - app.companiesFull[r2.company]);
            Cookies.set('companiesFull', app.companiesFull);
          }
          app['$forceUpdate']();
        },
        error: (error) => {
          console.error(error);
          app.error = error.statusText;
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
