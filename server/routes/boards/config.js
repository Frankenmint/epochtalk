var Joi = require('joi');
var path = require('path');
var Boom = require('boom');
var commonPre = require(path.normalize(__dirname + '/../common')).auth;
var pre = require(path.normalize(__dirname + '/pre'));
var db = require(path.normalize(__dirname + '/../../../db'));

/**
  * @apiDefine BoardObjectSuccess
  * @apiSuccess {string} id The board's unique id
  * @apiSuccess {string} name The board's name
  * @apiSuccess {string} description The boards description
  * @apiSuccess {timestamp} created_at Timestamp of when the board was created
  * @apiSuccess {timestamp} updated_at Timestamp of when the board was updated
  * @apiSuccess {timestamp} imported_at Timestamp of when the board was imported
  */

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {POST} /boards Create
  * @apiName CreateBoard
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Used to create a new board
  *
  * @apiParam (Payload) {string} name The name of the board to be created
  * @apiParam (Payload) {string} description The description text for the board
  *
  * @apiUse BoardObjectSuccess
  *
  * @apiError (Error 500) InternalServerError There was an issue creating the board
  */
exports.create = {
  auth: { mode: 'required', strategy: 'jwt' },
  validate: {
    payload: {
      name: Joi.string().min(1).max(255).required(),
      description: Joi.string().allow(''),
      category_id: [ Joi.string(), Joi.number() ],
      parent_id: [ Joi.string(), Joi.number() ],
      children_ids: [ Joi.array(Joi.string()), Joi.array(Joi.number()) ]
    }
  },
  pre: [
    { method: pre.clean },
    { method: commonPre.adminCheck }
  ],
  handler: function(request, reply) {
    db.boards.create(request.payload)
    .then(function(board) { reply(board); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {POST} /boards/import Import
  * @apiName ImportBoard
  * @apiPermission Super Administrator
  * @apiDescription Used to import a board. Currently only SMF is supported for import.
  *
  * @apiParam (Payload) {object} smf Object containing SMF metadata
  * @apiParam (Payload) {number} smf.ID_BOARD Legacy smf board id
  * @apiParam (Payload) {string} id The board's unique id
  * @apiParam (Payload) {string} name The board's name
  * @apiParam (Payload) {string} description The boards description
  * @apiParam (Payload) {timestamp} created_at Timestamp of when the board was created
  * @apiParam (Payload) {timestamp} updated_at Timestamp of when the board was updated
  * @apiParam (Payload) {timestamp} imported_at Timestamp of when the board was imported
  *
  * @apiUse BoardObjectSuccess
  * @apiSuccess {object} smf Object containing SMF metadata
  * @apiSuccess {number} smf.ID_BOARD Legacy smf board id
  *
  * @apiError (Error 500) InternalServerError There was an issue creating the board
  */
exports.import = {
  // validate: {
  //   payload: {
  //     name: Joi.string().required(),
  //     description: Joi.string(),
  //     category_id: [ Joi.string(), Joi.number() ],
  //     created_at: Joi.date(),
  //     updated_at: Joi.date(),
  //     parent_id: [ Joi.string(), Joi.number() ],
  //     children_ids: [ Joi.array(Joi.string()), Joi.array(Joi.number()) ],
  //     deleted: Joi.boolean(),
  //     smf: Joi.object().keys({
  //       ID_BOARD: Joi.number(),
  //       ID_PARENT: Joi.number()
  //     })
  //   }
  // },
  pre: [ { method: pre.clean } ],
  handler: function(request, reply) {
    db.boards.import(request.payload)
    .then(function(board) { reply(board); })
    .catch(function(err) {
      request.log('error', 'Import board: ' + JSON.stringify(err, ['stack', 'message'], 2));
      reply(Boom.badImplementation(err));
    });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {POST} /boards/:id Find
  * @apiName FindBoard
  * @apiDescription Used to find a board.
  *
  * @apiParam {string} id The id of the board to lookup
  *
  * @apiUse BoardObjectSuccess
  * @apiSuccess {number} thread_count Number of threads this board contains
  * @apiSuccess {number} post_count Number of posts this board contains
  * @apiSuccess {array} moderators Moderators of this board
  *
  * @apiError (Error 500) InternalServerError There was an issue finding the board
  */
exports.find = {
  auth: { mode: 'try', strategy: 'jwt' },
  validate: {
    params: {
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }
  },
  handler: function(request, reply) {
    if (!request.server.methods.viewable(request)) { return reply({}); }

    db.boards.find(request.params.id)
    .then(function(board) { reply(board); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {GET} /boards/all All
  * @apiName AllBoard
  * @apiDescription Used to find all boards.
  *
  * @apiSuccess {array} boards Array containing all of the forums boards
  *
  * @apiError (Error 500) InternalServerError There was an issue finding all boards
  */
exports.all = {
  auth: { mode: 'try', strategy: 'jwt' },
  handler: function(request, reply) {
    if (!request.server.methods.viewable(request)) { return reply([]); }

    db.boards.all()
    .then(function(boards) { reply(boards); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};


/**
  * @apiVersion 0.3.0
  * @apiGroup Categories
  * @api {GET} /boards All Categories
  * @apiName AllCategories
  * @apiDescription Used to retrieve all boards within their respective categories.
  *
  * @apiSuccess {array} categories Array containing all of the forums boards in their respective categories
  *
  * @apiError (Error 500) InternalServerError There was an issue retrieving categories
  */
exports.allCategories = {
  auth: { mode: 'try', strategy: 'jwt' },
  handler: function(request, reply) {
    if (!request.server.methods.viewable(request)) { return reply([]); }

    db.boards.allCategories()
    .then(function(categories) { reply(categories); })
    .catch(function(err) {
      reply(Boom.badImplementation(err));
    });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Categories
  * @api {POST} /boards/categories Update Categories
  * @apiName UpdateCategories
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Upsert for create/modifying boards within their categories.
  *
  * @apiParam (Payload) {array} categories Array containing all of the forums boards in their respective categories
  *
  * @apiSuccess {array} categories Array containing all of the forums boards in their respective categories
  *
  * @apiError (Error 500) InternalServerError There was an issue retrieving categories
  */
exports.updateCategories = {
  auth: { mode: 'required', strategy: 'jwt' },
  pre: [ { method: commonPre.adminCheck } ],
  validate: { payload: { boardMapping: Joi.array().required() } },
  handler: function(request, reply) {
    // update board on db
    db.boards.updateCategories(request.payload.boardMapping)
    .then(function(categories) { reply(categories); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {POST} /boards/:id Update
  * @apiName UpdateBoard
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Used to update an existing boards information.
  *
  * @apiParam {string} id The id of the board being updated
  *
  * @apiParam (Payload) {string} name The name of the board to be created
  * @apiParam (Payload) {string} description The description text for the board
  *
  * @apiUse BoardObjectSuccess
  *
  * @apiError (Error 500) InternalServerError There was an issue updating the board
  */
exports.update = {
  auth: { mode: 'required', strategy: 'jwt' },
  validate: {
    payload: {
      name: Joi.string().min(1).max(255),
      description: Joi.string().allow(''),
      category_id: [ Joi.string(), Joi.number() ],
      parent_id: [ Joi.string(), Joi.number() ],
      children_ids: Joi.array()
    },
    params: {
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }
  },
  pre: [
    { method: pre.clean },
    { method: commonPre.adminCheck }
  ],
  handler: function(request, reply) {
    // build updateBoard object from params and payload
    var updateBoard = {
      id: request.params.id,
      name: request.payload.name,
      description: request.payload.description,
      children_ids: request.payload.children_ids,
      parent_id: request.payload.parent_id
    };

    // update board on db
    db.boards.update(updateBoard)
    .then(function(board) { reply(board); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Boards
  * @api {DELETE} /boards/:id Delete
  * @apiName DeleteBoard
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Used to delete an existing board from the forum.
  *
  * @apiParam {string} id The id of the board being deleted
  *
  * @apiUse BoardObjectSuccess
  *
  * @apiError (Error 500) InternalServerError There was an issue deleting the board
  */
exports.delete = {
  auth: { mode: 'required', strategy: 'jwt' },
  validate: {
    params: {
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }
  },
  pre: [
    { method: commonPre.adminCheck }
  ],
  handler: function(request, reply) {
    db.boards.delete(request.params.id)
    .then(function(board) { reply(board); })
    .catch(function(err) { reply(Boom.badImplementation(err)); });
  }
};
