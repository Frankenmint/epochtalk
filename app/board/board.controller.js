module.exports = ['$rootScope', '$scope', '$anchorScroll', '$location', '$timeout', 'Session', 'Boards', 'Threads', 'board', 'threads', 'page', 'threadLimit', 'postLimit',
  function($rootScope, $scope, $anchorScroll, $location, $timeout, Session, Boards, Threads, board, threads, page, threadLimit, postLimit) {
    var ctrl = this;
    this.loggedIn = Session.isAuthenticated; // check Auth
    this.board = board;
    this.page = page; // this page
    this.postLimit = postLimit;
    this.threadLimit = threadLimit;
    this.threads = threads.normal;
    this.stickyThreads = threads.sticky;

    this.parent = $scope.$parent.BoardWrapperCtrl;
    this.parent.loggedIn = Session.isAuthenticated;
    this.parent.board  = board;
    this.parent.page = page;
    this.parent.pageCount = Math.ceil(board.thread_count / threadLimit);
    this.parent.newThreadUrl = '/boards/' + board.id + '/threads/new';

    // set total_thread_count and total_post_count for all boards
    board.children.map(function(childBoard) {
      var children = countTotals(childBoard.children);
      childBoard.total_thread_count = children.thread_count + childBoard.thread_count;
      childBoard.total_post_count = children.post_count + childBoard.post_count;
    });

    function countTotals(countBoards) {
      var thread_count = 0;
      var post_count = 0;

      if (countBoards.length > 0) {
        countBoards.forEach(function(countBoard) {
          var children = countTotals(countBoard.children);
          thread_count += children.thread_count + countBoard.thread_count;
          post_count += children.post_count + countBoard.post_count;
          countBoard.total_thread_count = thread_count;
          countBoard.total_post_count = post_count;
        });
      }

      return {thread_count: thread_count, post_count: post_count};
    }

    // generate page listing for each thread
    this.getPageKeysForThread = function(thread) {
      var pageKeys = [];
      if (thread.page_count < 7) {
        var i = 1;
        while(pageKeys.push({ val: i++, threadId: thread.id}) < thread.page_count) {}
      }
      else {
        var thirdToLastPage = (thread.page_count - 2);
        var secondToLastPage = (thread.page_count - 1);
        var lastPage = thread.page_count;
        pageKeys.push({ val: 1, threadId: thread.id });
        pageKeys.push({ val: 2, threadId: thread.id });
        pageKeys.push({ val: 3, threadId: thread.id });
        pageKeys.push({ val: '&hellip;', threadId: null });
        pageKeys.push({ val: thirdToLastPage, threadId: thread.id });
        pageKeys.push({ val: secondToLastPage, threadId: thread.id });
        pageKeys.push({ val: lastPage, threadId: thread.id });
      }
      pageKeys.push({ val: 'All', threadId: thread.id });
      thread.page_keys = pageKeys;
    };

    // page count for each thread
    function threadPageCount(thread) {
      // user based UI
      if (thread.has_new_post) { thread.title_class = 'bold'; }
      thread.page_count = Math.ceil(thread.post_count / ctrl.postLimit);
      ctrl.getPageKeysForThread(thread);
    }
    threads.normal.forEach(threadPageCount);
    threads.sticky.forEach(threadPageCount);

    // Scroll fix for nested state
    $timeout($anchorScroll);

    this.offLCS = $rootScope.$on('$locationChangeSuccess', function() {
      var params = $location.search();
      var page = Number(params.page) || 1;
      var limit = Number(params.limit) || 10;
      var pageChanged = false;
      var limitChanged = false;

      if (page && page !== ctrl.page) {
        pageChanged = true;
        ctrl.parent.page = page;
        ctrl.page = page;
      }
      if (limit && limit !== ctrl.threadLimit) {
        limitChanged = true;
        ctrl.threadLimit = limit;
      }

      if(pageChanged || limitChanged) { ctrl.pullPage(); }
    });
    $scope.$on('$destroy', function() { ctrl.offLCS(); });

    this.pullPage = function() {
      var query = {
        board_id: ctrl.board.id,
        page: ctrl.page,
        limit: ctrl.threadLimit
      };

      // update board's thread page count
      Boards.get({ id: ctrl.board.id }).$promise
      .then(function(board) {
        ctrl.parent.pageCount = Math.ceil(board.thread_count / ctrl.threadLimit);
      });

      // replace current threads with new threads
      Threads.byBoard(query).$promise
      .then(function(threads) {
        ctrl.threads = threads.normal;
        ctrl.stickyThreads = threads.sticky;
        ctrl.threads.forEach(threadPageCount);
        ctrl.stickyThreads.forEach(threadPageCount);
        $timeout($anchorScroll);
      });
    };

  }
];
