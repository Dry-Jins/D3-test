/**
 * Created by skyjin on 2017-05-05.
 */
var circos = {
    WIDTH: null,
    HEIGHT: null,
    IR: null,
    OR: null,
    R_SVG: null,
    A_SVG: null,
    SUM_TOTAL: null,
    SUM_ARRY: null,
    COLOR: null,
    CANVAS: null,
    CTX: null,
    GROUP: null,
    ARC: null,
    PIE: null,
    ARCS: null,
    AREA: null,
    init: function () {
        var thisObj = this;
        var width = $('body').width();
        var height = $('body').width() - 420;
        thisObj.WIDTH = width, thisObj.HEIGHT = height;
        thisObj.OR = width / 2 - 380, thisObj.IR = width / 2 - 330;
        loading.style('top', width / 2 - 170 - 32)
            .style('left', width / 2 - 32);
        $('canvas').attr('width', width).attr('height', height);
        $('svg').remove();
        // create a selection of a detached element to increase performance
        var svgDom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgDom.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        thisObj.R_SVG = d3.select(svgDom)
            .attr("class", "chart")
            .attr("width", width)
            .attr("height", height);

        thisObj.COLOR = d3.scaleOrdinal(d3.schemeAccent);
        thisObj.CANVAS = d3.select('canvas');
        thisObj.CTX = thisObj.CANVAS.node().getContext('2d');
        var v_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        v_svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        thisObj.A_SVG = d3.select(v_svg)
            .attr("class", "chart")
            .attr("width", width)
            .attr("height", height);

        thisObj.ARC = d3.arc()
            .innerRadius(thisObj.IR+50)
            .outerRadius(thisObj.OR+50)
            .cornerRadius(2)
            .padRadius(300)
            .padAngle(0.01);

        thisObj.PIE = d3.pie()
            .sort(null)
            .value(function (d) {
                return d.len;
            });

        thisObj.AREA = d3.area()
            .x0(function (d) {
                return d.x0;
            })
            .x1(function (d) {
                return d.x1;
            })
            .y0(function (d) {
                return d.y0;
            })
            .y1(function (d) {
                return d.y1;
            })
            .curve(d3.curveBasis);
    },
    makeRibbons: function (ribbons_data, arcs_data, score_range) {
        //  ribbon
        loading.style('display', 'block');
        var thisObj = this;
        // reset canvas and virtual svg dom;
        thisObj.CTX.clearRect(0, 0, thisObj.WIDTH, thisObj.HEIGHT);
        thisObj.R_SVG.select('g').remove();

        thisObj.R_SVG
            .append('g')
            .selectAll("path.ribbon")
            .data(ribbons_data.filter(function (d) {
                var sf = score_range.split(',');
                return (d.score <= parseInt(sf[1])) && (d.score >= parseInt(sf[0]));
            }))
            .enter()
            .append("path")
            .attr("class", "ribbon")
            .attr("id", function (d, i) {
                var tag = "z" + d.s_chr;
                return tag;
            })
            .attr("d", function (d) {
                //if ( d.score < sf ) return;
                var source, source2, target, target2;
                var scale_s = d3.scaleLinear();
                var scale_t = d3.scaleLinear();
                var sum = mafParser.DATA.sum;
                var width = thisObj.WIDTH;
                var height = thisObj.HEIGHT;
                var s_prev_sum = _.find(arcs_data, {'name': d.source, 'chr': d.s_chr}).prev_sum;
                var t_prev_sum = _.find(arcs_data, {'name': d.target, 'chr': d.t_chr}).prev_sum;

                if (d.s_op == "+") {
                    source = ((d.s_start + s_prev_sum) / sum) * 2 * Math.PI;
                    source2 = ((d.s_start + d.s_opr + s_prev_sum) / sum) * 2 * Math.PI;
                }
                else {
                    source = ((d.s_start - d.s_opr + s_prev_sum) / sum) * 2 * Math.PI;
                    source2 = ((d.s_start + s_prev_sum) / sum) * 2 * Math.PI;
                }
                scale_s.domain([(s_prev_sum / sum) * 2 * Math.PI, ((s_prev_sum + d.s_total) / sum) * 2 * Math.PI])
                    .range([(s_prev_sum / sum) * 2 * Math.PI + 3 / thisObj.IR, ((s_prev_sum + d.s_total) / sum) * 2 * Math.PI - 3 / thisObj.IR])


                if (d.t_op == "+") {
                    target = ((t_prev_sum + d.t_start) / sum) * 2 * Math.PI;
                    target2 = ((t_prev_sum + d.t_start + d.t_opr) / sum) * 2 * Math.PI;
                }
                else {
                    target = ((t_prev_sum + d.t_start - d.t_opr) / sum) * 2 * Math.PI;
                    target2 = ((t_prev_sum + d.t_start) / sum) * 2 * Math.PI;
                }

                scale_t.domain([(t_prev_sum / sum) * 2 * Math.PI, ((t_prev_sum + d.t_total) / sum) * 2 * Math.PI])
                    .range([(t_prev_sum / sum) * 2 * Math.PI + 3 / thisObj.IR, ((t_prev_sum + d.t_total) / sum) * 2 * Math.PI - 3 / thisObj.IR])

                var area_data = [
                    {
                        x0: width / 2 + (thisObj.IR - 5) * Math.sin(scale_s(source)),
                        y0: height / 2 - (thisObj.IR - 5) * Math.cos(scale_s(source)),
                        x1: width / 2 + (thisObj.IR - 5) * Math.sin(scale_s(source2)),
                        y1: height / 2 - (thisObj.IR - 5) * Math.cos(scale_s(source2))
                    },
                    {x0: width / 2, y0: height / 2, x1: width / 2, y1: height / 2},
                    {
                        x0: width / 2 + (thisObj.IR - 5) * Math.sin(scale_t(target)),
                        y0: height / 2 - (thisObj.IR - 5) * Math.cos(scale_t(target)),
                        x1: width / 2 + (thisObj.IR - 5) * Math.sin(scale_t(target2)),
                        y1: height / 2 - (thisObj.IR - 5) * Math.cos(scale_t(target2))
                    }
                ];
                return thisObj.AREA(area_data);
            })
            .attr("stroke", function (d) {
                var idx = _.findIndex(arcs_data, {'name': d.source, 'chr': d.s_chr});
                return thisObj.COLOR(idx);
            })
            .attr("stroke-width", 0.5)
            .style("fill", function (d) {
                var idx = _.findIndex(arcs_data, {'name': d.source, 'chr': d.s_chr});
                return thisObj.COLOR(idx);
            })
            .append("target")
            .attr("id", function (d, i) {
                return "h" + d.t_chr;
            });

        // canvas rendering;
        svgToCanvas(thisObj.R_SVG.node());
    },
    makeArcs: function (data, sum) {
        var thisObj = this;
        var width = thisObj.WIDTH, height = thisObj.HEIGHT;
        var color = thisObj.COLOR;
        var group = thisObj.A_SVG
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        var arcs = group.selectAll(".arc")
            .data(thisObj.PIE(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        log(thisObj.PIE(data));
        group.select(".arc")
            .append("text")
            .attr("text-anchor", "middle")
            .text(data[data.length - 1].name.toUpperCase())
            .attr("transform", "translate(-400,300)")
            .style("stroke", "gray")
            .style("font-size", 50);

        group.select(".arc")
            .append("text")
            .attr("text-anchor", "middle")
            .text(data[0].name.toUpperCase())
            .attr("transform", "translate(400,-300)")
            .style("stroke", "gray")
            .style("font-size", 50);

        //  arc, text and interaction
        arcs.append("path")
            .attr("d", thisObj.ARC)
            .attr("fill", function (d, i) {
                if (i >= mafParser.DATA.len_source)
                    return "gray";
                else
                    return color(i);
            })
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style('cursor', 'pointer')
            .on("mouseover", function (d, i) {
                thisObj.CTX.clearRect(0, 0, thisObj.WIDTH, thisObj.HEIGHT);
                thisObj.makeRibbons(mafParser.DATA.ribbons.filter(function (item) {
                    return (item.source == d.data.name) && (item.s_chr == d.data.chr);
                }), mafParser.DATA.arcs, $('#score').val());
                var text = d.data.name + ' - ' + d.data.chr + ' - ' + d.data.len + ' length';
                $('input.label-arc').val(text).css('display', 'block');

            })
            .on("mouseout", function (d, i) {
                //thisObj.CTX.clearRect(0, 0, thisObj.WIDTH, thisObj.HEIGHT);
                //thisObj.makeRibbons(mafParser.DATA.ribbons, mafParser.DATA.arcs, $('#score').val());
            });

        /*
         arcs.append("svg:text")
         .attr("transform", function (d) {
         var radius = thisObj.OR;
         return "translate(" + ( (radius + 25) * Math.sin(((d.endAngle - d.startAngle) / 2) + d.startAngle) ) + "," + ( -1 * (radius + 25) * Math.cos(((d.endAngle - d.startAngle) / 2) + d.startAngle) ) + ")";
         })
         //.attr("dy", ".35em")
         .style('font-size',9)
         .style("text-anchor", function (d) {
         return 'middle';
         var rads = ((d.endAngle - d.startAngle) / 2) + d.startAngle;
         if ((rads > 7 * Math.PI / 4 && rads < Math.PI / 4) || (rads > 3 * Math.PI / 4 && rads < 5 * Math.PI / 4)) {
         return "middle";
         } else if (rads >= Math.PI / 4 && rads <= 3 * Math.PI / 4) {
         return "start";
         } else if (rads >= 5 * Math.PI / 4 && rads <= 7 * Math.PI / 4) {
         return "end";
         } else {
         return "middle";
         }
         })
         .text(function (d) {
         return d.data.chr;
         });

        arcs.append('svg:text')
            .attr('transform', function (d, i) {
                var p = 1340447187;
                var angle = -90 + 360 * ((p - d.data.len / 2 + data[i].prev_sum) / sum);
                //var angle = (d.data.len / 2 + (data[i].prev_sum)) / sum;
                var move = thisObj.OR + 50;
                if (angle < -90 || angle > 90) {
                    angle += (180 - 720 * (p / sum));
                    move *= -1;
                }
                return "rotate(" + (angle) + ")" + "translate(" + move + ",0)"
            })
            .attr("text-anchor", "middle")
            .style("stroke", function (d,i) {
                if (i >= mafParser.DATA.len_source)
                    return "steelblue";
                else
                    return thisObj.COLOR(i);
            }).text(function (d) {
                return d.data.chr;
        });

         */

        arcs.append("svg:text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")"; })
            .attr("transform", function(d) { //set the label's origin to the center of the arc
                //we have to make sure to set these before calling arc.centroid
                log(d);
                thisObj.ARC
                    .innerRadius(thisObj.IR+100)
                    .outerRadius(thisObj.OR+100);

                return "translate(" + thisObj.ARC.centroid(d) + ")rotate(" + angle(d) + ")";
            })
            .style("stroke", function (d,i) {
                if (i >= mafParser.DATA.len_source)
                    return "steelblue";
                else
                    return thisObj.COLOR(i);
            })
            .text(function(d) { return d.data.chr; });

        // Computes the angle of an arc, converting from radians to degrees.
        function angle(d) {
            var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
            return a > 90 ? a - 180 : a;
        }


        // render arc svg
        document.querySelector('#canvas_container').appendChild(thisObj.A_SVG.node());
        loading.style('display', 'none');
    },
    drawAll: function () {
        var thisObj = this;
        thisObj.makeRibbons(mafParser.DATA.ribbons, mafParser.DATA.arcs, $('#score').val());
    }
};