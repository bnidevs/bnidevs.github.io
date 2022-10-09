// The svg
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
const path = d3.geoPath();
const projection = d3.geoMercator().scale(150).center([0, 20]);

// Data and color scale
const popdensity = new Map();
const population = new Map();
const colorScale = d3
  .scaleThreshold()
  .domain([1, 5, 10, 20, 40, 100])
  .range(d3.schemeBlues[7]);

let optionmap = {
  popdensity: popdensity,
  population: population,
};

let optionname = {
  popdensity: "Population Density",
  population: "Population",
};

let optionunit = {
  popdensity: "(people per sq km)",
  population: "(millions)",
};

let tooltip = d3.select("#tooltip");
let tooltip_bg = d3
  .select("#tooltip_bg")
  .attr("fill", "#FFF")
  .attr("height", "3em")
  .style("stroke", "black")
  .style("opacity", 0);

// Load external data and boot
Promise.all([
  d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  ),
  d3.csv(
    "https://datasci-general.s3.amazonaws.com/SYB64_1_202110_Population%2C%2BSurface%2BArea%2Band%2BDensity_cleaned.csv",
    function (d) {
      if (d.Series === "Population density") {
        popdensity.set(d.Country, +d.Value);
      }

      if (d.Series === "Population mid-year estimates (millions)") {
        population.set(d.Country, +d.Value);
      }
    }
  ),
]).then(function (loadData) {
  d3.select("#opts").on("change", function () {
    let whichdata = d3.select("#opts").property("value");

    let topo = loadData[0];

    let mouseOver = function (d) {
      d3.selectAll(".Country").transition().duration(200).style("opacity", 0.5);
      d3.select(this).transition().duration(200).style("opacity", 1);
      tooltip_bg.style("opacity", 1);
      tooltip.style("opacity", 1);
    };

    let mouseLeave = function (d) {
      d3.selectAll(".Country").transition().duration(200).style("opacity", 0.8);
      tooltip.style("opacity", 0);
      tooltip_bg.style("opacity", 0);
    };

    let mouseMove = function (event, d) {
      const country_name = d3.select("#country_name");
      country_name.text(`${d.properties.name}`);

      const country_data = d3.select("#country_data");
      country_data.text(
        `${optionname[whichdata]}: ${d.total} ${optionunit[whichdata]}`
      );

      const [x, y] = d3.pointer(event);
      tooltip.attr("transform", `translate(${x},${y + 40})`);
      tooltip_bg.attr(
        "width",
        Math.max(
          d3.select("#country_data").node().getBBox().width,
          d3.select("#country_name").node().getBBox().width
        )
      );

      tooltip.style("opacity", 1);
      tooltip_bg.style("opacity", 1);
    };

    svg.select("#plotg").selectAll("path").remove();

    svg
      .select("#plotg")
      .selectAll("path")
      .data(topo.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath().projection(projection))
      .attr("fill", function (d) {
        d.total = optionmap[whichdata].get(d.properties.name) || 0;
        return colorScale(d.total);
      })
      .style("stroke", "transparent")
      .attr("class", function (d) {
        return "Country";
      })
      .style("opacity", 0.8)
      .on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
      .on("mousemove", mouseMove);
  });

  let whichdata = "population";

  let topo = loadData[0];

  let mouseOver = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.5);
    d3.select(this).transition().duration(200).style("opacity", 1);
    tooltip.style("opacity", 1);
    tooltip_bg.style("opacity", 1);
  };

  let mouseLeave = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.8);
    tooltip.style("opacity", 0);
    tooltip_bg.style("opacity", 0);
  };

  let mouseMove = function (event, d) {
    const country_name = d3.select("#country_name");
    country_name.text(`${d.properties.name}`);

    const country_data = d3.select("#country_data");
    country_data.text(
      `${optionname[whichdata]}: ${d.total} ${optionunit[whichdata]}`
    );

    const [x, y] = d3.pointer(event);
    tooltip.attr("transform", `translate(${x},${y + 40})`);
    tooltip_bg.attr(
      "width",
      Math.max(
        d3.select("#country_data").node().getBBox().width,
        d3.select("#country_name").node().getBBox().width
      )
    );

    tooltip.style("opacity", 1);
    tooltip_bg.style("opacity", 1);
  };

  svg
    .select("#plotg")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath().projection(projection))
    .attr("fill", function (d) {
      d.total = optionmap[whichdata].get(d.properties.name) || 0;
      return colorScale(d.total);
    })
    .style("stroke", "transparent")
    .attr("class", function (d) {
      return "Country";
    })
    .style("opacity", 0.8)
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave)
    .on("mousemove", mouseMove);
});
