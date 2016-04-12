/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isAndroid = /Android/.test(navigator.userAgent);
var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
//var isWindows = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
//var isWindowsPC = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
//var isWindowsPhone_8_1 = /Windows Phone 8.1/.test(navigator.userAgent); // Windows Phone 8.1
//var isIE = isWindows || isWP8 || isWindowsPhone_8_1;
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

// NOTE: In the core-master branch there is no difference between the default
// implementation and implementation #2. But the test will also apply
// the androidLockWorkaround: 1 option in the case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

// simple tests:
var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': misc. sql test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 0});
        }
      }


        /* THANKS to @calebeaires: */
        it(suiteName + 'create virtual table using FTS3', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite

          var db = openDatabase('virtual-table-using-fts3.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS3 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // NOTE: looking at sqlite3.c, if FTS3 is enabled, FTS4 seems to be working as well!
        // (thanks again to @calebeaires for this scenario)
        it(suiteName + 'create virtual table using FTS4', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite

          var db = openDatabase('virtual-table-using-fts4.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS4 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

      if (!isWebSql) {
        it(suiteName + 'create virtual table using R-Tree', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isAndroid) pending('NOT IMPLEMENTED for all versions of Android'); // NOT IMPLEMENTED for all versions of Android database (failed in Circle CI)

          var db = openDatabase('virtual-table-using-r-tree.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS demo_index');
            // from https://www.sqlite.org/rtree.html
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS demo_index USING rtree (id, minX, maxX, minY, maxY);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);
      }

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'Skip callbacks after syntax error with no handler', function(done) {
          if (!isWebSql) pending('Plugin BROKEN'); // XXX TODO

          var db = openDatabase('first-syntax-error-with-no-handler.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // This insertion has a sql syntax error-which is not handled:
            tx.executeSql('insert into tt (data) VALUES ', [123]);

            // second insertion with syntax error in transaction ["skipped" by Web SQL]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected, but then it shows the handling this sql statement is NOT skipped (by the plugin):
              expect(false).toBe(true);
              return false;
            });
          }, function(err) {
            // transaction expected to fail:
            expect(true).toBe(true);
            done();
          }, function() {
            // not expected [ignored for now]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'Skip callbacks after syntax error handler returns true', function(done) {
          if (!isWebSql) pending('Plugin BROKEN'); // XXX TODO

          var db = openDatabase('first-syntax-error-handler-returns-true.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          var isSecondErrorHandlerCalled = false;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // (should) completely stop transaction:
              return true;
            });

            // second insertion with syntax error with handler that signals explicit recovery [SKIPPED by Web SQL]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected, but then it shows the handling this sql statement is NOT skipped (by the plugin):
              expect(false).toBe(true);
              isSecondErrorHandlerCalled = true;
              // explicit recovery:
              return false;
            });
          }, function(err) {
            // transaction expected to fail:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // [ignored for now]:
            //expect(isSecondErrorHandlerCalled).toBe(false);
            done();
          }, function() {
            // not expected [ignored for now]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // [ignored for now]:
            //expect(isSecondErrorHandlerCalled).toBe(false);
            done();
          });
        }, MYTIMEOUT);

        // ref: litehelpers/Cordova-sqlite-storage#232
        // according to the spec at http://www.w3.org/TR/webdatabase/ the transaction should be
        // recovered *only* if the sql error handler returns false.
        it(suiteName + 'Recover transaction with callbacks after syntax error handler returns false', function(done) {
          var db = openDatabase('recover-if-syntax-error-handler-returns-false.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          //var isFirstSuccessHandlerCalled = false; // (not expected)
          var isSecondSuccessHandlerCalled = false; // expected ok
          //var isSecondErrorHandlerCalled = false; // (not expected)

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // [should] recover this transaction:
              return false;
            });

            // second sql ok [NOT SKIPPED by Web SQL]:
            tx.executeSql('SELECT 1', [], function(tx, res) {
              // expected ok:
              isSecondSuccessHandlerCalled = true;
              expect(true).toBe(true);
            }, function(err) {
              // not expected:
              expect(false).toBe(true);
              //isSecondErrorHandlerCalled = true;
              return false;
            });
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          }, function() {
            // expected ok:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            expect(isSecondSuccessHandlerCalled).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // NOTE: as discussed in litehelpers/Cordova-sqlite-storage#232 this plugin is correct
        // according to the spec at http://www.w3.org/TR/webdatabase/
        it(suiteName + 'syntax error handler returns undefined', function(done) {
          var db = openDatabase('syntax-error-handler-returns-undefined.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // [should] recover this transaction:
              //return false;
              return undefined;
            });

            // skip second sql [not relevant for this test, difference plugin vs. Web SQL]:

          }, function(err) {
            // transaction expected to fail [plugin only]:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          }, function() {
            // expected ok for Web SQL ONLY:
            if (isWebSql)
              expect(true).toBe(true);
            else
              expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // FUTURE TODO ref: litehelpers/Cordova-sqlite-storage#232
        // test case of sql error handler returning values such as "true" (string), 1, 0, null

        it(suiteName + 'empty transaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // synchronous error expected:
            db.transaction();

            // not expected to get here:
            expect(false).toBe(true);
          } catch (err) {
            // got error like we expected
            expect(true).toBe(true);
          }

          // verify we can still continue
          var gotStringLength = false; // poor man's spy
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });
          }, function (error) {
            // not expected:
            expect(false).toBe(true);
          }, function () {
            // expected result (transaction committed ok)
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            done();
          });
        });

        it(suiteName + 'empty readTransaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("read-tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // synchronous error expected:
            db.readTransaction();

            // not expected to get here:
            expect(false).toBe(true);
          } catch (err) {
            // got error like we expected
            expect(true).toBe(true);
          }

          // verify we can still continue
          var gotStringLength = false; // poor man's spy
          db.readTransaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });
          }, function (error) {
            // not expected:
            expect(false).toBe(true);
          }, function () {
            // expected result (transaction committed ok)
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            done();
          });
        });

        it(suiteName + 'empty transaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(true).toBe(true);
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            done();
          }, function() {
            // as expected:
            expect(true).toBe(true);

            // verify we can still continue
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // not expected:
              expect(false).toBe(true);
            }, function () {
              // expected result (transaction committed ok)
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              done();
            });

          });

        });

        // Check fix for litehelpers/Cordova-sqlite-storage#409:
        it(suiteName + 'empty readTransaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-read-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            expect(true).toBe(true);
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            done();
          }, function() {
            // as expected:
            expect(true).toBe(true);

            // verify we can still continue
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // not expected:
              expect(false).toBe(true);
            }, function () {
              // expected result (transaction committed ok)
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              done();
            });

          });

        });
    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
