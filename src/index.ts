// Here we find all the libraries that we need
import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { stats1March, stats23March, ResultEntry } from "./stats";

// This function takes two arguments(CCAA and an array of ResultEntry) and return a radius based on the max value of the scale
const calculateRadiusBasedOnAffectedCases = (comunidad: string, data: ResultEntry[]) => {

  // Here maxAffected calculates the max value of the array
  const maxAffected =
  data.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0);
  
  // Here affectedRadiusScale calculates the scale depending of the max value previously calculated
  const affectedRadiusScale =
  d3
  .scaleLinear()
  .domain([0, maxAffected])
  .range([0, 50]);

  // Now the variable entry finds the CCAA and the value of infected people with the name of the CCAA
  const entry = data.find(item => item.name === comunidad);
  return entry ? affectedRadiusScale(entry.value) : 0;
  };

// Function with two arguments(CCAA name and an array of ResultEntry) that returns the color of each CCAA
const assignCCAABackgroundColor = (comunidad: string, data: ResultEntry[]) => {
  
  // Here maxAffected calculates the max value of infected people of the array
  const maxAffected =
  data.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0);
  
  // Here color calculates the scale depending of the max value previously calculated
  const color =
  d3
  .scaleThreshold<number, string>()
  .domain([0, 0.05*maxAffected, 0.1*maxAffected, 0.4*maxAffected, 0.5*maxAffected, 0.6*maxAffected, maxAffected])
  .range([
    "#FFFFF",
    "#E1E9F4",
    "#C4D4E9",
    "#A5BFDE",
    "#839dbb",
    "#637d99",
    "#445e79",
    "#25415A"
  ]);
  
  // Now the variable item finds the CCAA name and the value of infected people with the name of the CCAA
  const item = data.find(
    item => item.name === comunidad
  );

  // At the end of this function the value required is returned
  return item ? color(item.value) : color(0);
};

// Here a backgroung will be created with the color #FBFAF0
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

// aProjection adjust the map of Spain with a correct scale and correctly centered
  const aProjection = d3Composite
  .geoConicConformalSpain()
  // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);

// In the following variables it will be convertered the topojson to a geojson
const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(
  spainjson,
  spainjson.objects.ESP_adm1
);

// Now the initial map of Spain will be displayed
svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // data loaded from json file
  .attr("d", geoPath as any);

// updateColorsAndRadius takes an argument(array ResultEntry) and calculates the color and the radius for each CCAA
const updateColorsAndRadius = (data: ResultEntry[]) => {
  const ccaa = svg.selectAll("path");
  ccaa
    .merge(ccaa as any)
    .transition()
    .duration(500)
    .attr("class", "country")
    .style("fill", function(d: any) {
      return assignCCAABackgroundColor(d.properties.NAME_1, data);
    })
    const circles = svg.selectAll("circle");
    circles
      .data(latLongCommunities)
      .enter()
      .append("circle") // Aggregate all the circles
      .merge(circles as any)
      .transition()
      .duration(500)
      .attr("class", "affected-marker")
      .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name, data))
      .attr("cx", d => aProjection([d.long, d.lat])[0]) // Calculate the X position
      .attr("cy", d => aProjection([d.long, d.lat])[1]) // Calculate the Y position
    };
  
  // Here with the buttom in HTML "1 March", the map of infected people in that date will be displayed
  document
  .getElementById("1March")
  .addEventListener("click", function handleInfected1March() {
    updateColorsAndRadius(stats1March);
  });

  // Here with the buttom in HTML "23 March", the map of infected people in that date will be displayed
  document
  .getElementById("23March")
  .addEventListener("click", function handleInfected23March() {
    updateColorsAndRadius(stats23March);
  });
