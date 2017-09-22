"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var auth = require("./auth");
var config = require("./config");

var fs = require("fs");
var crypto = require("crypto");
var pump = require("pump");

var alioss = require("ali-oss").Wrapper; // use promise

var oss_client = null;

if (config.oss && config.oss.type == "ali") {
	if (config.oss.enc) {
		var key = util.getPass();
		
		config.oss.acckey = auth.aes.dec(config.oss.acckey, key);
		config.oss.seckey = auth.aes.dec(config.oss.seckey, key);
		
		if (!config.oss.acckey || !config.oss.seckey) {
			util.log("file: incorrect password", util.style.red("ERROR"));
			process.exit();
		}
	}
	
	oss_client = new alioss({
		region: config.oss.region,
		accessKeyId: config.oss.acckey,
		accessKeySecret: config.oss.seckey,
		bucket: config.oss.bucket
	});
}

var readFileAsync = path => {
	return new Promise((res, rej) => {
		fs.readFile(path, (err, cont) => {
			if (err) rej(err);
			else res(cont);
		});
	});
};

var readdirAsync = path => {
	return new Promise((res, rej) => {
		fs.readdir(path, (err, files) => {
			if (err) rej(err);
			else res(files);
		});
	});
};

var existsAsync = path => {
	return new Promise((res, rej) => {
		fs.exists(path, (exist) => {
			res(exist);
		});
	});
};

var unlinkAsync = path => {
	return new Promise((res, rej) => {
		fs.unlink(path, (err) => {
			if (err) rej(err);
			else res();
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

	md5 = util.md5(ct + md5 + len, "hex");

	var found = await col.findOne({ chsum: md5 });
	var cached = false;
	
	if (!found) {
		// console.log("?? " + file + " " + md5);
		
		if (oss_client) {
			// upload to oss
			await oss_client.put(md5, file);
			cached = true;
		} else {
			// console.log("?? " + file + " " + md5);
			await moveFileAsync(file, dir(md5));
		}
		
		await col.insert({ ct: ct, chsum: md5, len: len, cached: cached });
	} else {
		if (len != found.len) {
			throw new err.Exc("$core.file_md5_collision");
		}
	}

	return md5;
};

var findFile = async (chsum) => {
	var col = await db.col("file");
	var found = await col.findOne({ chsum: chsum });

	if (!found)
		throw new err.Exc("$core.not_exist($core.file)");

	return found;
}

exports.getFile = async (chsum) => {
	var file = await findFile(chsum);

	if (!file.cached || !oss_client) {
		if (await existsAsync(dir(chsum))) {
			// has local file
			exports.cacheOne(chsum);
			return {
				ct: file.ct,
				cont: await readFileAsync(dir(chsum))
			};
		} else {
			throw new err.Exc("$core.file_missing(" + chsum + ")");
		}
	}
	
	return {
		ct: file.ct,
		redir: oss_client.signatureUrl(chsum /* default expire: 30 min */)
	}
};

exports.ref = async (chsum) => {
	var col = await db.col("file");
	var ret = await col.findOneAndUpdate({ chsum: chsum }, { $inc: { ref: 1 } });

	if (!ret.value)
		throw new err.Exc("$core.not_exist($core.file)");
};

exports.cacheOne = async md5 => {
	var col = await db.col("file");
	var local = dir(md5);

	if (oss_client && await existsAsync(local)) {
		await oss_client.put(md5, local);
		await col.updateOne({ chsum: md5 }, { $set: { cached: true } });
		await unlinkAsync(local);
	}
};

// upload all local files to the oss
exports.cacheFull = async () => {
	if (!oss_client) return;
	
	var col = await db.col("file");
	var files = await col.find({ cached: { $not: { $eq: true } } }).toArray();
	
	for (var i = 0; i < files.length; i++) {
		exports.cacheOne(files[i].chsum);
	}
};

exports.isLegalID = async (id) => {
	return /^(([0-9a-z]{32})|([0-9a-z]{64}))$/i.test(id);
};
