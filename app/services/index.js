angular.module('ept')
  .factory('Auth', require('./auth.js'))
  .factory('AuthInterceptor', require('./authInterceptor.js'))
  .factory('BreadcrumbSvc', require('./breadcrumbs.js'))
  .factory('ViewInterceptor', require('./viewInterceptor.js'))
  .factory('S3ImageUpload', require('./s3ImageUpload.js'))
  .factory('Session', require('./session.js'))
  .factory('Alert', require('./alert.js'));
