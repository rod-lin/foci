"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var config = require("./config");

var fs = require("fs");
var crypto = require("crypto");
var pump = require("pump");

var readFileAsync = path => {
	return new Promise((res, rej) => {
		fs.readFile(path, (err, cont) => {
			if (err) rej(err);
			else res(cont);
		});
	});
};

var dir = chsum => config.file.save_dir + "/" + chsum;

// get md5&length of the file
var md5FileAsync = file => {
	return new Promise((res, rej) => {
		var rstream = fs.createReadStream(file);
		// var wstream = fs.createWriteStream(pto);
		var chsum = crypto.createHash("md5");
		var len = 0;

		rstream.on("data", (chunk) => {
			// wstream.write(chunk);
			chsum.update(chunk);
			len += chunk.length;
		});

		rstream.on("end", () => {
			var md5 = chsum.digest("hex");
			res([ md5, len ]);
		});
	});
};

var moveFileAsync = (pfrom, pto) => {
	return new Promise((res, rej) => {
		var rstream = fs.createReadStream(pfrom);
		var wstream = fs.createWriteStream(pto);
		
		pump(rstream, wstream, err => {
			if (err) rej(err);
			else {
				fs.unlinkSync(pfrom);
				res();
			}
		});
	});
}

// db.file
// { type: content type, chsum: md5 checksum, size: size in bytes }

// file and content-type
exports.newFile = async (file, ct) => {
	var col = await db.col("file");
	var info = await md5FileAsync(file);

	var md5 = info[0];
	var len = info[1];

	md5 = util.md5(md5 + len, "hex");

	var found = await col.findOne({ chsum: md5 });

	if (!found)
		await moveFileAsync(file, dir(md5));

	var ret = await col.findOneAndUpdate({
		chsum: md5
	}, {
		$push: { ct: ct },
		$set: { chsum: md5, len: len }
	}, { returnOriginal: true, upsert: true });

	return md5;
};

exports.getFile = async (chsum) => {
	var col = await db.col("file");
	var found = await col.findOne({ chsum: chsum });

	if (!found)
		throw new err.Exc("no such file");

	var cont = await readFileAsync(dir(chsum));

	return {
		ct: found.ct[0],
		cont: cont
	};
};
