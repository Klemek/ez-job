const utils = {
  get: (url, data, proxy = false) => {
    return new Promise((resolve, reject) => {
      if (data && Object.keys(data).length) {
        url += '?' + Object.keys(data)
          .map(k => k + '=' + encodeURIComponent(data[k]))
          .join('&')
          .replace(/%20/g, '+');
      }
      const xhr = new XMLHttpRequest();
      if (proxy) {
        const http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
        url = http + '//crossorigin.me/' + url;
      }
      xhr.open('GET', url);
      xhr.onload = () => {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (ignored) {
          resolve(xhr.responseText);
        }
      };
      xhr.onerror = () => reject(xhr);
      xhr.send();
    });
  }
};

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
      utils.get('http://api.indeed.com/ads/apisearch', {
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
      }, true).then((res) => {
        app.requests++;
        app.results.push(...res.results);
        res.results.forEach(r => {
          app.companies[r.company] = (app.companies[r.company] || 0) + 1;
        });
        if (res.end < res.totalResults) {
          app.query(null, page + 1);
        } else {
          if (app.companiesQueried()) {
            app.results.sort((r1, r2) => app.companiesFull[r1.company] - app.companiesFull[r2.company]);
          } else {
            app.results.sort((r1, r2) => app.companies[r1.company] - app.companies[r2.company]);
            Object.keys(app.companies).forEach(name => {
              app.queryCompany(name);
            });
          }

        }
      }).catch((xhr) => {
        console.error(xhr);
        app.error = xhr.statusText;
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
      utils.get('http://api.indeed.com/ads/apisearch', {
        'v': '2',
        'format': 'json',
        'userip': '1.2.3.4',
        'useragent': 'Mozilla//4.0(Firefox)',
        'co': app.co,
        'filter': 'false',
        'limit': 1,
        'q': name,
        'publisher': '1303284387458115'
      }, true).then((res) => {
        app.requests++;
        app.companiesFull[name] = res.totalResults;
        if (app.companiesQueried()) {
          app.results.sort((r1, r2) => app.companiesFull[r1.company] - app.companiesFull[r2.company]);
          Cookies.set('companiesFull', app.companiesFull, {expires: 2});
        }
        app['$forceUpdate']();
      }).catch((xhr) => {
        console.error(xhr);
        app.error = xhr.statusText;
      });
    }
  },
  'mounted': () => {

  },
};

window.onload = () => {
  app = new Vue(app);
};
