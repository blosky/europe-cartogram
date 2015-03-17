function Worldmap(_width, _height, _initScale, _projection, _divId, _root, callBack)
{
	var _this = this;
	this.width = _width;
	this.height = _height;
	this.initScale = _initScale;
	this.projections = [];

	var div = d3.select("#"+_divId);
	var ratio = window.devicePixelRatio || 1;
	var p = [0,0];
	var r = [0,0];
	var countries;
	var borders;
	var conflict_borders;
	var conflict_bordersbg;
	var border;
	var cities;
	var city;
	var circles;
	var root = _root;
	var cont = 0;

	this.projections['Mercator'] = d3.geo.mercator();
	this.projections['Robinson'] = d3.geo.robinson();

	var projection = this.projections[_projection]
	.rotate([0, 0])
	.translate([this.width / 2, this.height / 2])
	.scale(this.initScale)
	.clipExtent([[-ratio, -ratio], [this.width + ratio, this.height + ratio]]);

	var path = d3.geo.path()
	.projection(projection);

	var zoom = d3.geo.zoom()
	.projection(projection)
	.scaleExtent([this.initScale, Infinity])
	.on("zoomstart", function() {
		countries.data(worldLow);
	})
	.on("zoom", function() {
		redraw();
	})
	.on("zoomend", function() {
		countries.data(_this.worldHigh);
		redraw();
	});

	var svg = div.append("svg")
	.attr("width", this.width)
	.attr("height", this.height)
	.call(zoom);

	this.worldHigh;
	var worldLow;
	var world = svg.append("g").attr("class", "world");

	queue()
	.defer(d3.json, root + "gm_world_raw.topojson")
	.defer(d3.json, root + "gm_world.topojson")
    .defer(d3.json, root + 'gm_disputed_areas.topojson') // geojson points
    .defer(d3.json, root + 'populated_places.topojson') 
    .await(function(error, low, high, disputed, populated)
    {

    	worldLow = topojson.feature(low, low.objects.gm_world).features;
    	_this.worldHigh = topojson.feature(high, high.objects.gm_world).features;
    	border = topojson.feature(disputed, disputed.objects.gm_disputed_areas).features;
    	city = topojson.feature(populated, populated.objects.populated_places).features;

    	world.selectAll(".country")
    	.data(_this.worldHigh)
    	.enter()
    	.insert("path", ".world")
    	.attr("class", function(d){return "country " + d.properties.adm0_a3})
    	.attr("d", path)
    	.on("click",_this.clicked);

    	countries = d3.selectAll(".country");

    	world
    	.datum(topojson.mesh(high, high.objects.gm_world, function(a,b){return a !== b}))
    	.insert("path", ".world")
    	.attr("class", "boundary")
    	.attr("d", path)

    	borders = d3.selectAll(".boundary")

    	world.selectAll(".borderbg")
    	.data(border)
    	.enter()
    	.insert("path", ".world")
    	.attr("class", "borderbg")
    	.attr("d", path);

    	world.selectAll(".border")
    	.data(border)
    	.enter()
    	.insert("path", ".world")
    	.attr("class", "border")
    	.attr("d", path);

    	conflict_borders = d3.selectAll(".border");
    	conflict_bordersbg = d3.selectAll(".borderbg");

    	circles = d3.selectAll(".circle");

    	callBack();
    });

function zoomBounds(projection, o)
{
	var centroid = d3.geo.centroid(o);
	var clip = projection.clipExtent();

	projection
	.clipExtent(null)
	.scale(1)
	.translate([0, 0]);

	var b = path.bounds(o),
	k = Math.min(Infinity, .45 / Math.max(Math.max(Math.abs(b[1][0]), Math.abs(b[0][0])) / _this.width, Math.max(Math.abs(b[1][1]), Math.abs(b[0][1])) / _this.height));

	projection
	.clipExtent(clip)
	.scale(k)
	.translate([_this.width / 2, _this.height / 2]);

	zoom.scale(k);
}


function redraw()
{
	countries.attr("d", path);
	borders.attr("d", path);
	conflict_borders.attr("d", path);
	conflict_bordersbg.attr("d", path);

	if(cities)cities.attr("transform", function(d) {return "translate(" + projection(d.geometry.coordinates) + ")"; })
}

    //---------------------------------------------------------------------------------------------
    //PUBLIC METHODS
    //---------------------------------------------------------------------------------------------

    this.clicked = function(d)
    {

    	if(cities)d3.selectAll(".place-label").remove();
    	p = d3.geo.centroid(d);
    	r = [-p[0], -p[1]];
    	projection.rotate(r);
    	zoomBounds(projection, d)

    	var selected = d.properties.adm0_a3;
    	d3.select(".selected").classed("selected", false)
    	d3.select("." + selected).classed("selected", true)

    	world.selectAll(".cities")
    	.data(city)
    	.enter().insert("text", ".world")
    	.filter(function(d) { return d.properties.adm0_a3 == selected})
    	.attr("class", function(d)
    	{
    		if(d.properties.pop_max > 10000000)return "place-label " + 'l0'
    		else if(d.properties.pop_max > 5000000 & d.properties.pop_max<=10000000)return "place-label " + 'l1'
    		else if(d.properties.pop_max > 1000000 & d.properties.pop_max<=5000000)return "place-label " + 'l2'
    		else if(d.properties.pop_max > 500000 & d.properties.pop_max<=1000000)return "place-label " + 'l3'
    		else if(d.properties.pop_max > 200000 & d.properties.pop_max<=500000)return "place-label " + 'l4'
    		else if(d.properties.pop_max > 100000 & d.properties.pop_max<=200000)return "place-label " + 'l5'
    		else if(d.properties.pop_max > 50000 & d.properties.pop_max<=100000)return "place-label " + 'l6'
    		else if(d.properties.pop_max > 20000 & d.properties.pop_max<=50000)return "place-label " + 'l7'
    		else if(d.properties.pop_max > 10000 & d.properties.pop_max<=20000)return "place-label " + 'l8'
    		else if(d.properties.pop_max > 5000 & d.properties.pop_max<=10000)return "place-label " + 'l9'
    		else if(d.properties.pop_max > 2000 & d.properties.pop_max<=5000)return "place-label " + 'l10'
    		else if(d.properties.pop_max > 1000 & d.properties.pop_max<=2000)return "place-label " + 'l11'
    		else if(d.properties.pop_max > 200 & d.properties.pop_max<=1000)return "place-label " + 'l12'
    		else if(d.properties.pop_max > 0 & d.properties.pop_max<=200)return "place-label " + 'l13'
    		else return "place-label " + 'l14'
    	})
    	.text(function(d) { return d.properties.name; })
    	.on("click", function(d){this.remove()});

    	cities = d3.selectAll(".place-label");

    	cities
	    .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
	    .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });

    	redraw();
    }

    this.reset = function()
    {
    	r= [0,0];
    	zoom.scale(this.initScale);

    	projection.rotate([0, 0]);
    	projection.translate([_this.width / 2, _this.height / 2]);
    	projection.scale(this.initScale);

    	redraw();
    }

    this.resetPorjection = function(string)
    {
    	projection = this.projections[string];
    	projection.rotate(r);
    	projection.scale(zoom.scale())

    	path.projection(projection);
    	zoom.projection(projection);

    	projection.translate([_this.width / 2, _this.height / 2]);

    	redraw();
    }

    this.zoomClick = function(direction)
    {
    	var factor = 0.2;
    	var target_zoom = 1;
    	var center = [_this.width / 2 ,  _this.height / 2];

    	d3.event.preventDefault();
    	target_zoom = zoom.scale() * (1 + factor * direction);

    	if(direction == 1)cont++;
    	else cont--;

    	if(target_zoom < zoom.scaleExtent()[0] || target_zoom > zoom.scaleExtent()[1]) return false;

    	var iScale = d3.interpolate(zoom.scale(), target_zoom);
    	if(cont<=0)cont=0;
    	var scale = iScale(cont);
    	if(scale<=this.initScale)scale = this.initScale;


    	projection.scale(iScale(cont))
    	zoom.scale(scale);
    	redraw();
    }

    this.resetView = function()
    {
	    projection
		.translate([_this.width / 2, _this.height / 2])
		.clipExtent([[-ratio, -ratio], [_this.width + ratio, _this.height + ratio]]);

		svg
		.attr("width", _this.width)
		.attr("height",_this.height);

		redraw();
    }

    this.setWidth = function(w)
    {
    	console.log(Object.prototype.toString.call(w),typeOf(w), typeOf(w) === "Number");
    	if (typeOf(w) === "Number" && w >= 100)
    	_this.width = w;
	}
    	

    this.setHeight = function(h)
    {
    	if (typeOf(h) === "Number" && h >= 100)
    	_this.height = h;
    }

    function typeOf(value)
    {
    	return Object.prototype.toString.call(value).slice(8, -1);
	}
}