const chai = require('chai');
const expect = chai.expect;
const transpiler = require('../index');

const imports = [
  {
    description: 'Single import Code',
    input: {
      shell: '{x: Code("code")}',
      javascript: '{x: Code("code")}',
      python: "{'x': Code('code')}"
    },
    output: {
      java: `import org.bson.types.Code;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import Code with scope',
    input: {
      shell: '{x: Code("code", {x: 1})}',
      javascript: '{x: Code("code", {x: 1})}',
      python: "{'x': Code('code', {'x', 1})}"
    },
    output: {
      java: `import org.bson.Document;
import org.bson.types.Code;
import org.bson.types.CodeWithScope;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import ObjectId',
    input: {
      shell: '{x: ObjectId()}',
      javascript: '{x: ObjectId()}',
      python: "{'x': ObjectId()}"
    },
    output: {
      java: `import org.bson.types.ObjectId;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId',
      javascript: `const {
  ObjectId
} = require('mongo');`
    }
  },
  {
    description: 'Single import Timestamp',
    input: {
      shell: '{x: Timestamp(1, 2)}',
      javascript: '{x: Timestamp(1, 2)}',
      python: "{'x': Timestamp(1, 2)}"
    },
    output: {
      java: `import org.bson.types.BSONTimestamp;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import DBRef',
    input: {
      shell: '{x: DBRef("db", ObjectId())}',
      javascript: '{x: DBRef("db", ObjectId())}',
      python: "{'x': DBRef('db', ObjectId())}"
    },
    output: {
      java: `import org.bson.types.ObjectId;
import com.mongodb.DBRef;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId, DBRef',
      javascript: `const {
  ObjectId,
  DBRef
} = require('mongo');`
    }
  },
  {
    description: 'Single import Double',
    input: {
      shell: '{x: 1}',
      javascript: '{x: Double(1)}',
      python: "{'x': 1}"
    },
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import NumberInt',
    input: {
      shell: '{x: NumberInt(1)}',
      javascript: '{x: Int32(1)}',
      python: "{'x': int(1)}"
    },
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Int32
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberLong',
    input: {
      shell: '{x: NumberLong(1)}',
      javascript: '{x: Long(1, 100)}',
      python: "{'x': Int64(1)}"
    },
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Int64',
      javascript: `const {
  Long
} = require('mongo');`
    }
  },
  {
    description: 'Single import MinKey',
    input: {
      shell: '{x: MinKey()}',
      javascript: '{x: MinKey()}',
      python: "{'x': MinKey()}"
    },
    output: {
      java: `import org.bson.types.MinKey;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MinKey',
      javascript: `const {
  MinKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import MaxKey',
    input: {
      shell: '{x: MaxKey()}',
      javascript: '{x: MaxKey()}',
      python: "{'x': MaxKey()}"
    },
    output: {
      java: `import org.bson.types.MaxKey;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MaxKey',
      javascript: `const {
  MaxKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import RegExp',
    input: {
      shell: '{x: RegExp("abc")}',
      javascript: '{x: RegExp("abc")}'
      // python: "" TODO: regex
    },
    output: {
      java: `import java.util.regex.Pattern;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import BSONRegExp',
    input: {
      javascript: '{x: BSONRegExp("abc")}',
      python: "{'x': Regex('abc')}"
    },
    output: {
      java: `import org.bson.BsonRegularExpression;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Regex'
    }
  },
  {
    description: 'Single import literal regex',
    input: {
      shell: '{x: /abc/g}',
      javascript: '{x: /abc/g}'
      // python: '' TODO
    },
    output: {
      java: `import java.util.regex.Pattern;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import Timestamp',
    input: {
      shell: '{x: Timestamp(1, 2)}',
      javascript: '{x: Timestamp(1, 2)}',
      python: "{'x': Timestamp(1, 2)}"
    },
    output: {
      java: `import org.bson.types.BSONTimestamp;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import Symbol',
    input: {
      shell: '{x: Symbol("a")}',
      javascript: '{x: Symbol("a")}'
    },
    output: {
      java: `import org.bson.types.Symbol;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Symbol
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberDecimal',
    input: {
      shell: '{x: NumberDecimal(1)}',
      javascript: '{x: Decimal128(1)}',
      python: "{'x': Decimal128('1')}"
    },
    output: {
      java: `import org.bson.types.Decimal128;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Decimal128',
      javascript: `const {
  Decimal128
} = require('mongo');`
    }
  },
  {
    description: 'Single import Date as string',
    input: {
      shell: '{x: Date()}',
      javascript: '{x: Date()}'
    },
    output: {
      java: `import java.text.SimpleDateFormat;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import Date() as object',
    input: {
      shell: '{x: new Date()}',
      javascript: '{x: new Date()}',
      python: "{'x': datetime()}"
    },
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import ISODate',
    input: {
      shell: '{x: ISODate()}',
      javascript: '{x: new Date(1)}'
    },
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Multiple imports without Date to string',
    input: {
    },
    output: {
      java: '',
      csharp: '',
      javascript: ''
    }
  },
  {
    description: 'Multiple imports',
    input: {
      shell: `{
      0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: NumberDecimal(1), '201a': new Date(),
      '201b': ISODate(), '201c': new ISODate()
    }`,
      javascript: `{
      0: true, 1: 1, 2: Long(1, 100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: Double(1), 105: Int32(1), 106: Long(1, 100),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: Decimal128([1]), '201a': new Date()
    }`
      // python: "{'0': True, '1': 1, '2': Int64(429496729601), '3': 0.001, '4': 0x1243, '5': 0o123, '6': 10, '7': 'str', '9': [1, 2], '9a': (1, 2), '10': {'x': 1}, '11': None, '100': Code('1', {'x': 1}), '100a': Code('!'), '101': ObjectId(), '103': DBRef('c', ObjectId()), '104': float(1), '105': int(1), '106': Int64(429496729601), '107': MinKey(), '108': MaxKey(), '110': Timestamp(1, 100), '111': '1', '112': Decimal128('1E-6176'), '201a': datetime.utcnow(), 202: Regex('a')}"
    },
    output: {
      java: `import java.util.regex.Pattern;
import java.util.Arrays;
import org.bson.Document;
import org.bson.BsonNull;
import org.bson.BsonUndefined;
import org.bson.types.Code;
import org.bson.types.ObjectId;
import com.mongodb.DBRef;
import org.bson.types.MinKey;
import org.bson.types.MaxKey;
import org.bson.types.BSONTimestamp;
import org.bson.types.Symbol;
import org.bson.types.Decimal128;
import org.bson.types.CodeWithScope;
import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using System;`,
      python: `import datetime
from bson import Code, ObjectId, DBRef, Int64, MinKey, MaxKey, Timestamp, Decimal128`,
      javascript: `const {
  Code,
  ObjectId,
  DBRef,
  Int32,
  Long,
  MinKey,
  MaxKey,
  Timestamp,
  Symbol,
  Decimal128
} = require('mongo');`
    }
  },
  {
    description: 'All filter builder imports',
    input: {
      shell: `[
  {
    $and: [{x: 1}],
    $expr: 1,
    all: {$all: [1,2]}, bitsAllClear: {$bitsAllClear: [1, 1]},
    bitsAllSet: {$bitsAllSet: [1, 1]}, bitsAnyClear: {$bitsAnyClear: [1, 1]},
    bitsAnySet: {$bitsAnySet: [1, 1]}, elemMatch: {$elemMatch: {x: 1}},
    eq: {$eq: 1}, exists: {$exists: true},
    gt: {$gt: 1}, gte: {$gte: 1}, lt: {$lt: 1}, lte: {$lte: 1}, in: {$in: [1, 2]},
    mod: {$mod: [1,2]}, ne: {$ne: 1}, nin: {$nin: [1, 2]},
    $nor: [{x: 1}, {y: 1}], not: {$not: {$eq: 1}}, $or: [{x: 1}, {y: 2}],
    regex: {$regex: 'abc', $options: 'c'}, size: {$size: 1},
    type: {$type: 'string'}, $where: '1',
    $text: {$search: '1'},
    x1: {$geoWithin: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x2: {$geoWithin: {$box: [ [1, 2], [3, 4] ]}},
    x3: {$geoWithin: {$polygon: [ [1, 2], [3, 4], [5, 6], [1, 2] ]}},
    x4: {$geoWithin: {$center: [ [1, 2], 5 ]}},
    x5: {$geoWithin: {$centerSphere: [ [1, 2], 5 ]}},
    x6: {$geoIntersects: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x7: {$near: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}},
    x8: {$nearSphere: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}}
  }
]`,
      javascript: `[
  {
    $and: [{x: 1}],
    $expr: 1,
    all: {$all: [1,2]}, bitsAllClear: {$bitsAllClear: [1, 1]},
    bitsAllSet: {$bitsAllSet: [1, 1]}, bitsAnyClear: {$bitsAnyClear: [1, 1]},
    bitsAnySet: {$bitsAnySet: [1, 1]}, elemMatch: {$elemMatch: {x: 1}},
    eq: {$eq: 1}, exists: {$exists: true},
    gt: {$gt: 1}, gte: {$gte: 1}, lt: {$lt: 1}, lte: {$lte: 1}, in: {$in: [1, 2]},
    mod: {$mod: [1,2]}, ne: {$ne: 1}, nin: {$nin: [1, 2]},
    $nor: [{x: 1}, {y: 1}], not: {$not: {$eq: 1}}, $or: [{x: 1}, {y: 2}],
    regex: {$regex: 'abc', $options: 'c'}, size: {$size: 1},
    type: {$type: 'string'}, $where: '1',
    $text: {$search: '1'},
    x1: {$geoWithin: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x2: {$geoWithin: {$box: [ [1, 2], [3, 4] ]}},
    x3: {$geoWithin: {$polygon: [ [1, 2], [3, 4], [5, 6], [1, 2] ]}},
    x4: {$geoWithin: {$center: [ [1, 2], 5 ]}},
    x5: {$geoWithin: {$centerSphere: [ [1, 2], 5 ]}},
    x6: {$geoIntersects: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x7: {$near: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}},
    x8: {$nearSphere: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}}
  }
]`,
      python: "[{'$and': [{'x': 1}], '$expr': 1, 'all': {'$all': [1, 2]}, 'bitsAllClear': {'$bitsAllClear': [1, 1]}, 'bitsAllSet': {'$bitsAllSet': [1, 1]}, 'bitsAnyClear': {'$bitsAnyClear': [1, 1]}, 'bitsAnySet': {'$bitsAnySet': [1, 1]}, 'elemMatch': {'$elemMatch': {'x': 1}}, 'eq': {'$eq': 1}, 'exists': {'$exists': True}, 'gt': {'$gt': 1}, 'gte': {'$gte': 1}, 'lt': {'$lt': 1}, 'lte': {'$lte': 1}, 'in': {'$in': [1, 2]}, 'mod': {'$mod': [1, 2]}, 'ne': {'$ne': 1}, 'nin': {'$nin': [1, 2]}, '$nor': [{'x': 1}, {'y': 1}], 'not': {'$not': {'$eq': 1}}, '$or': [{'x': 1}, {'y': 2}], 'regex': {'$regex': 'abc', '$options': 'c'}, 'size': {'$size': 1}, 'type': {'$type': 'string'}, '$where': '1', '$text': {'$search': '1'}, 'x1': {'$geoWithin': {'$geometry': {'type': 'Point', 'coordinates': [1, 2]}}}, 'x2': {'$geoWithin': {'$box': [[1, 2], [3, 4]]}}, 'x3': {'$geoWithin': {'$polygon': [[1, 2], [3, 4], [5, 6], [1, 2]]}}, 'x4': {'$geoWithin': {'$center': [[1, 2], 5]}}, 'x5': {'$geoWithin': {'$centerSphere': [[1, 2], 5]}}, 'x6': {'$geoIntersects': {'$geometry': {'type': 'Point', 'coordinates': [1, 2]}}}, 'x7': {'$near': {'$geometry': {'type': 'Point', 'coordinates': [1, 2]}, '$minDistance': 10, '$maxDistance': 100}}, 'x8': {'$nearSphere': {'$geometry': {'type': 'Point', 'coordinates': [1, 2]}, '$minDistance': 10, '$maxDistance': 100}}}]"
    },
    output: {
      java: `import java.util.Arrays;
import static com.mongodb.client.model.Filters.all;
import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.bitsAllClear;
import static com.mongodb.client.model.Filters.bitsAllSet;
import static com.mongodb.client.model.Filters.bitsAnyClear;
import static com.mongodb.client.model.Filters.bitsAnySet;
import static com.mongodb.client.model.Filters.elemMatch;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.exists;
import static com.mongodb.client.model.Filters.expr;
import static com.mongodb.client.model.Filters.geoIntersects;
import static com.mongodb.client.model.Filters.geoWithin;
import static com.mongodb.client.model.Filters.geoWithinBox;
import static com.mongodb.client.model.Filters.geoWithinCenter;
import static com.mongodb.client.model.Filters.geoWithinCenterSphere;
import static com.mongodb.client.model.Filters.geoWithinPolygon;
import static com.mongodb.client.model.Filters.gt;
import static com.mongodb.client.model.Filters.gte;
import static com.mongodb.client.model.Filters.in;
import static com.mongodb.client.model.Filters.lt;
import static com.mongodb.client.model.Filters.lte;
import static com.mongodb.client.model.Filters.mod;
import static com.mongodb.client.model.Filters.ne;
import static com.mongodb.client.model.Filters.near;
import static com.mongodb.client.model.Filters.nearSphere;
import static com.mongodb.client.model.Filters.nin;
import static com.mongodb.client.model.Filters.nor;
import static com.mongodb.client.model.Filters.not;
import static com.mongodb.client.model.Filters.or;
import static com.mongodb.client.model.Filters.regex;
import static com.mongodb.client.model.Filters.size;
import static com.mongodb.client.model.Filters.text;
import static com.mongodb.client.model.Filters.type;
import static com.mongodb.client.model.Filters.where;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Position;`
    }
  },
  {
    description: 'All agg builder imports',
    input: {
      shell: `[
  { $count: "field" },
  { $facet: { output1: [{ $match: {x: 1} }] } },
  { $graphLookup: {
      from: "collection",
      startWith: "$expr",
      connectFromField: "fromF",
      connectToField: "toF",
      as: "asF",
      maxDepth: 10,
      depthField: "depthF",
      restrictSearchWithMatch: { x: 1 } } },
  { $group: { _id: "idField" } },
  { $limit: 1 },
  { $lookup: {
       from: 'fromColl',
       localField: 'localF',
       foreignField: 'foreignF',
       as: 'outputF'
     } },
  { $match: {x: 1} },
  { $out: "coll" },
  { $project: { x: true, y: true, _id: 0 } },
  { $replaceRoot: { newRoot: { x: "newDoc" } } },
  { $sample: { size: 1 } },
  { $skip: 10 },
  { $sort: { x: 1, y: -1, z: { $meta: 'textScore' } } },
  { $sortByCount: "$expr" },
  { $unwind: "$field" }
]`,
      javascript: `[
  { $count: "field" },
  { $facet: { output1: [{ $match: {x: 1} }] } },
  { $graphLookup: {
      from: "collection",
      startWith: "$expr",
      connectFromField: "fromF",
      connectToField: "toF",
      as: "asF",
      maxDepth: 10,
      depthField: "depthF",
      restrictSearchWithMatch: { x: 1 } } },
  { $group: { _id: "idField" } },
  { $limit: 1 },
  { $lookup: {
       from: 'fromColl',
       localField: 'localF',
       foreignField: 'foreignF',
       as: 'outputF'
     } },
  { $match: {x: 1} },
  { $out: "coll" },
  { $project: { x: true, y: true, _id: 0 } },
  { $replaceRoot: { newRoot: { x: "newDoc" } } },
  { $sample: { size: 1 } },
  { $skip: 10 },
  { $sort: { x: 1, y: -1, z: { $meta: 'textScore' } } },
  { $sortByCount: "$expr" },
  { $unwind: "$field" }
]`,
      python: "[{'$count': 'field'}, {'$facet': {'output1': [{'$match': {'x': 1}}]}}, {'$graphLookup': {'from': 'collection', 'startWith': '$expr', 'connectFromField': 'fromF', 'connectToField': 'toF', 'as': 'asF', 'maxDepth': 10, 'depthField': 'depthF', 'restrictSearchWithMatch': {'x': 1}}}, {'$group': {'_id': 'idField'}}, {'$limit': 1}, {'$lookup': {'from': 'fromColl', 'localField': 'localF', 'foreignField': 'foreignF', 'as': 'outputF'}}, {'$match': {'x': 1}}, {'$out': 'coll'}, {'$project': {'x': True, 'y': True, '_id': 0}}, {'$replaceRoot': {'newRoot': {'x': 'newDoc'}}}, {'$sample': {'size': 1}}, {'$skip': 10}, {'$sort': {'x': 1, 'y': -1, 'z': {'$meta': 'textScore'}}}, {'$sortByCount': '$expr'}, {'$unwind': '$field'}]"
    },
    output: {
      java: `import java.util.Arrays;
import org.bson.Document;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Aggregates.count;
import static com.mongodb.client.model.Aggregates.facet;
import static com.mongodb.client.model.Aggregates.graphLookup;
import static com.mongodb.client.model.Aggregates.group;
import static com.mongodb.client.model.Aggregates.limit;
import static com.mongodb.client.model.Aggregates.lookup;
import static com.mongodb.client.model.Aggregates.match;
import static com.mongodb.client.model.Aggregates.out;
import static com.mongodb.client.model.Aggregates.project;
import static com.mongodb.client.model.Aggregates.replaceRoot;
import static com.mongodb.client.model.Aggregates.sample;
import static com.mongodb.client.model.Aggregates.skip;
import static com.mongodb.client.model.Aggregates.sort;
import static com.mongodb.client.model.Aggregates.sortByCount;
import static com.mongodb.client.model.Aggregates.unwind;
import static com.mongodb.client.model.Projections.excludeId;
import static com.mongodb.client.model.Projections.fields;
import static com.mongodb.client.model.Projections.include;
import static com.mongodb.client.model.Sorts.ascending;
import static com.mongodb.client.model.Sorts.descending;
import static com.mongodb.client.model.Sorts.metaTextScore;
import static com.mongodb.client.model.Sorts.orderBy;
import com.mongodb.client.model.Facet;
import com.mongodb.client.model.GraphLookupOptions;`
    }
  },
  {
    description: 'all geometry builder imports',
    input: {
      shell: `[
    {$geometry: {type: "Point", coordinates: [1, 2]}},
    {$geometry: {type: "MultiPoint", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "LineString", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "MultiLineString", coordinates: [
        [ [1, 2], [3, 4], [5, 6] ],
        [ [7, 8], [9, 10 ] ],
      ]}},
    {$geometry: {type: "Polygon", coordinates: [
        [ [1, 2], [3, 4], [5, 6], [1, 2] ],
        [ [7, 8], [9, 10], [9, 11], [7, 8] ],
        [ [9, 10], [11, 12], [11, 10], [9, 10] ]
      ]}},
    {$geometry: {type: "MultiPolygon", coordinates: [
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]
        ],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]
      ]}},
    {$geometry: {type: "GeometryCollection", coordinates: [
        {type: "Point", coordinates: [1, 2]},
        {type: "MultiPoint", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "LineString", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "MultiLineString", coordinates: [ [[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]] ]},
        {type: "Polygon", coordinates: [[ [1, 2], [3, 4], [5, 6], [1, 2] ]]},
        {type: "MultiPolygon", coordinates: [
        [[ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]]}]}}
]`,
      javascript: `[
    {$geometry: {type: "Point", coordinates: [1, 2]}},
    {$geometry: {type: "MultiPoint", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "LineString", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "MultiLineString", coordinates: [
        [ [1, 2], [3, 4], [5, 6] ],
        [ [7, 8], [9, 10 ] ],
      ]}},
    {$geometry: {type: "Polygon", coordinates: [
        [ [1, 2], [3, 4], [5, 6], [1, 2] ],
        [ [7, 8], [9, 10], [9, 11], [7, 8] ],
        [ [9, 10], [11, 12], [11, 10], [9, 10] ]
      ]}},
    {$geometry: {type: "MultiPolygon", coordinates: [
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]
        ],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]
      ]}},
    {$geometry: {type: "GeometryCollection", coordinates: [
        {type: "Point", coordinates: [1, 2]},
        {type: "MultiPoint", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "LineString", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "MultiLineString", coordinates: [ [[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]] ]},
        {type: "Polygon", coordinates: [[ [1, 2], [3, 4], [5, 6], [1, 2] ]]},
        {type: "MultiPolygon", coordinates: [
        [[ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]]}]}}
]`,
      python: "[{'$geometry': {'type': 'Point', 'coordinates': [1, 2]}}, {'$geometry': {'type': 'MultiPoint', 'coordinates': [[1, 2], [3, 4], [5, 6]]}}, {'$geometry': {'type': 'LineString', 'coordinates': [[1, 2], [3, 4], [5, 6]]}}, {'$geometry': {'type': 'MultiLineString', 'coordinates': [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]]]}}, {'$geometry': {'type': 'Polygon', 'coordinates': [[[1, 2], [3, 4], [5, 6], [1, 2]], [[7, 8], [9, 10], [9, 11], [7, 8]], [[9, 10], [11, 12], [11, 10], [9, 10]]]}}, {'$geometry': {'type': 'MultiPolygon', 'coordinates': [[[[1, 2], [3, 4], [5, 6], [1, 2]]], [[[1, 2], [3, 4], [5, 6], [1, 2]], [[7, 8], [9, 10], [9, 11], [7, 8]], [[9, 10], [11, 12], [11, 10], [9, 10]]]]}}, {'$geometry': {'type': 'GeometryCollection', 'coordinates': [{'type': 'Point', 'coordinates': [1, 2]}, {'type': 'MultiPoint', 'coordinates': [[1, 2], [3, 4], [5, 6]]}, {'type': 'LineString', 'coordinates': [[1, 2], [3, 4], [5, 6]]}, {'type': 'MultiLineString', 'coordinates': [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]]]}, {'type': 'Polygon', 'coordinates': [[[1, 2], [3, 4], [5, 6], [1, 2]]]}, {'type': 'MultiPolygon', 'coordinates': [[[[1, 2], [3, 4], [5, 6], [1, 2]]], [[[1, 2], [3, 4], [5, 6], [1, 2]], [[7, 8], [9, 10], [9, 11], [7, 8]], [[9, 10], [11, 12], [11, 10], [9, 10]]]]}]}}]"
    },
    output: {
      java: `import java.util.Arrays;
import com.mongodb.client.model.geojson.GeometryCollection;
import com.mongodb.client.model.geojson.LineString;
import com.mongodb.client.model.geojson.MultiLineString;
import com.mongodb.client.model.geojson.MultiPoint;
import com.mongodb.client.model.geojson.MultiPolygon;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Polygon;
import com.mongodb.client.model.geojson.PolygonCoordinates;
import com.mongodb.client.model.geojson.Position;`
    }
  },
  {
    description: 'all accumulator builder imports',
    input: {
      shell: `[
  {x: {$sum: 1}},
  {x: {$avg: 1}},
  {x: {$first: 1}},
  {x: {$last: 1}},
  {x: {$max: 1}},
  {x: {$min: 1}},
  {x: {$push: 1}},
  {x: {$addToSet: 1}},
  {x: {$stdDevPop: 1}},
  {x: {$stdDevSamp: 1}}
]`,
      javascript: `[
  {x: {$sum: 1}},
  {x: {$avg: 1}},
  {x: {$first: 1}},
  {x: {$last: 1}},
  {x: {$max: 1}},
  {x: {$min: 1}},
  {x: {$push: 1}},
  {x: {$addToSet: 1}},
  {x: {$stdDevPop: 1}},
  {x: {$stdDevSamp: 1}}
]`,
      python: "[{'x': {'$sum': 1}}, {'x': {'$avg': 1}}, {'x': {'$first': 1}}, {'x': {'$last': 1}}, {'x': {'$max': 1}}, {'x': {'$min': 1}}, {'x': {'$push': 1}}, {'x': {'$addToSet': 1}}, {'x': {'$stdDevPop': 1}}, {'x': {'$stdDevSamp': 1}}]"
    },
    output: {
      java: `import java.util.Arrays;
import static com.mongodb.client.model.Accumulators.addToSet;
import static com.mongodb.client.model.Accumulators.avg;
import static com.mongodb.client.model.Accumulators.first;
import static com.mongodb.client.model.Accumulators.last;
import static com.mongodb.client.model.Accumulators.max;
import static com.mongodb.client.model.Accumulators.min;
import static com.mongodb.client.model.Accumulators.push;
import static com.mongodb.client.model.Accumulators.stdDevPop;
import static com.mongodb.client.model.Accumulators.stdDevSamp;
import static com.mongodb.client.model.Accumulators.sum;`
    }
  }
];

describe('imports', () => {
  for (const test of imports) {
    describe(`${test.description}`, () => {
      for (const input of Object.keys(test.input)) {
        for (const output of Object.keys(test.output)) {
          if (input !== output) {
            it(`correct ${output} imports from ${input}`, () => {
              transpiler[input][output].compile(test.input[input]);
              expect(
                transpiler[input][output].getImports()
              ).to.equal(test.output[output]);
            });
          }
        }
      }
    });
  }
});
