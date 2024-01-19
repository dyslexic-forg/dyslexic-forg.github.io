import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class PlotArea{
    constructor(configs) {
        this.configs = {
            container: d3.select(configs.container),
            width: configs.width || 500,
            height: configs.height || 500,
            margins: configs.margins || {left: 30, top: 30, right: 30, bottom: 30},
            xRange: configs.xRange || [0, 1],
            yRange: configs.yRange || [0, 1],

        };

        this.svg = d3.create("svg")
            .attr("viewBox", `0 0 ${this.configs.width} ${this.configs.height}`);
        this.configs.container.node().append(this.svg.node());
        this.configs.container.style("max-width", this.configs.width + "px");

        this.xScale = d3.scaleLinear()
            .domain(this.configs.xRange)
            .range([this.configs.margins.left, this.configs.width - this.configs.margins.right]);
        this.yScale = d3.scaleLinear()
            .domain(this.configs.yRange)
            .range([this.configs.height - this.configs.margins.bottom, this.configs.margins.top]);

        this.xAxis = d3.axisBottom(this.xScale);
        this.yAxis = d3.axisLeft(this.yScale)
          .tickFormat(function(d) {
            return d === 0 ? "" : d; // Esconde o rótulo se for zero
        });

        const yAxisPosition = this.xScale(0) >= this.configs.margins.left && this.xScale(0) <= this.configs.width - this.configs.margins.right
        ? this.xScale(0) : this.configs.margins.left;

        const xAxisPosition = this.yScale(0) >= this.configs.margins.top && this.yScale(0) <= this.configs.height - this.configs.margins.bottom
        ? this.yScale(0) : this.configs.height - this.configs.margins.bottom;

        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${xAxisPosition})`)
            .call(this.xAxis);

        this.svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${yAxisPosition}, 0)`)
            .call(this.yAxis);
    }

    createIfNotExists(type, name){
        return (
            this.svg.select("."+name).node()
            ? this.svg.select("."+name)
            : this.svg.append(type)
            .attr("class", name)
        );
    }

    plot(name, f, domain, n=100, style={}){
        const data = generatePoints(f, domain, n);
        const graph = this.createIfNotExists("path", name).datum(data);

        const line = d3.line()
              .x(d => this.xScale(d.x))
              .y(d => this.yScale(d.y));

        graph.attr("fill", "none")
            .attr("stroke", style.color || "black")
            .attr("stroke-width", style.width || 3)
            .transition()
            .attr("d", line);
    }

    plotRegion(name, f, domain, n=100, style={}){
        const data = generatePoints(f, domain, n);
        const region = this.createIfNotExists("path", name).datum(data);

        const area = d3.area()
              .x(d => this.xScale(d.x))
              .y0(this.yScale(0))
              .y1(d => this.yScale(d.y));

        region.attr("fill", style.fill || "lightblue")
            .attr("stroke", style.stroke || "none")
            .transition()
            .attr("d", area);
    }

    plotPoints(name, data, style={}){
        const points = this.createIfNotExists("g", name)
              .selectAll(".point")
              .data(data);
        points.exit().remove();
        points.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", style.r || 3)
            .attr("fill", style.fill || "black")
            .attr("stroke", style.stroke || "none")
            .merge(points)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y));
    }

    plotRects(name, data, style={}){
        const rects = this.createIfNotExists("g", name)
              .selectAll(".rect")
              .data(data);
        rects.exit().remove();
        rects.enter()
            .append("rect")
            .attr("class", "rect")
            .attr("fill", style.fill || "rgba(255, 0, 0, 0.4)")
            .attr("stroke", style.stroke || "rgba(255, 0, 0, 0.5)")
            .merge(rects)
            .attr("x", d => this.xScale(d.x))
            .attr("y", d => this.yScale(d.y))
            .attr("width", d => this.xScale(d.width) - this.xScale(0))
            .attr("height", d => this.yScale(0) - this.yScale(d.height));
    }
}

export function generatePoints(f, domain, n){
    const points = [];
    const dx = (domain[1] - domain[0]) / (n - 1);
    let x = domain[0];
    for(let i = 0; i < n; i++){
        points.push({x, y: f(x)});
        x += dx;
    }
    return points;
}

export function generateRects(interval, n, heightFunction, style={}){
    const rects = [];
    const dx = (interval[1] - interval[0]) / n;
    let x1 = interval[0];
    let x2 = x1 + dx;
    for(let i = 0; i < n; i++){
        let y = heightFunction(x1, x2);
        rects.push({x: x1, y: y, width: dx, height: y});
        x1 = x2;
        x2 += dx;
    }
    return rects;
}
