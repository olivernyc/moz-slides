const fs = require("fs");

const nodesA = require("../nodes/active-jan-18.json");
const nodesB = require("../nodes/active.json");

const linksA = require("../nodes/links-jan-18.json");
const linksB = require("../nodes/links.json");

const diff = markNewNodes(nodesA.features, nodesB.features);
writeFile("./nodes/active-new-18.json", diff);

const linksDiff = markNewNodes(linksA.features, linksB.features);
writeFile("./nodes/links-new-18.json", linksDiff);

function markNewNodes(nodesA, nodesB) {
	const aIds = {};
	const bIds = {};
	for (var i = nodesA.length - 1; i >= 0; i--) {
		const node = nodesA[i];
		aIds[getKey(node)] = true;
	}
	return nodesB.map(node => ({
		...node,
		properties: {
			...node.properties,
			install_year: !aIds[getKey(node)] ? 2018 : 2017
		}
	}));
}

function getNodeDiff(nodesA, nodesB) {
	const aIds = {};
	const bIds = {};
	for (var i = nodesA.length - 1; i >= 0; i--) {
		const node = nodesA[i];
		aIds[getKey(node)] = true;
	}
	return nodesB.filter(node => !aIds[getKey(node)]);
}

function getKey(nodeOrLink) {
	return nodeOrLink.properties && nodeOrLink.properties.id
		? nodeOrLink.properties.id
		: JSON.stringify(nodeOrLink.geometry);
}

function writeFile(fileName, features) {
	fs.writeFileSync(
		fileName,
		JSON.stringify({
			type: "FeatureCollection",
			features
		})
	);
}
