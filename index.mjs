import { HttpsProxyAgent } from "https-proxy-agent";
import { parse, stringify } from "yaml";
import fetch from "node-fetch";
import express from "express";
import _ from "lodash";
import fs from "fs";

const app = express();
const port = 3000;
const localConfigPath = "./configs/config.yml";
const localConvertFnPath = "./configs/convert.mjs";

app.get("/sub", async (req, res) => {
  if (req.query.url) {
    res.set("Content-Type", "application/x-yaml");
    const base = getRemoteConfig(req.query.url, req.query.agent);
    const override = getOverrideConfig(req.query.config);
    try {
      res.send(await convertFn(mergeYamlConfig(await base, await override)));
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    res.status(500).send({ error: "params error" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function mergeYamlConfig(origin, override) {
  const a = parse(origin);
  const b = parse(override);
  const ret = _.mergeWith(a, b, (a, b) => {
    if (Array.isArray(a)) {
      return b.concat(a);
    } else if (typeof a === "object") {
      return { ...b, ...a };
    } else {
      return b;
    }
  });
  return stringify(ret);
}

async function convertFn(yamlConfig) {
  if (!fs.existsSync(localConvertFnPath)) return yamlConfig;
  const convert = await import(localConvertFnPath);
  return stringify(convert.default(parse(yamlConfig)));
}

async function getOverrideConfig(url, agentUrl) {
  if (url) {
    return getRemoteConfig(url, agentUrl);
  }
  if (fs.existsSync(localConfigPath)) {
    return fs.readFileSync(localConfigPath, { encoding: "utf-8" });
  }
  return "";
}

function getRemoteConfig(url, agentUrl) {
  if (agentUrl) {
    return fetch(url, { agent: getProxyAgent(agentUrl) }).then((r) => r.text());
  } else {
    return fetch(url).then((r) => r.text());
  }
}

function getProxyAgent(agentUrl) {
  const proxyUrl = agentUrl;
  const agent = new HttpsProxyAgent(proxyUrl);
  return agent;
}
