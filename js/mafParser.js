/**
 * Created by dryji on 2017-05-04.
 */

var mafParser = {
    DATA: {maf: null, arcs: null, ribbons: null, sum: null, len_source: null, len_target: null, min: null, max: null},
    init: function () {


    },
    openFile: function (event) {
        //  ribbon
        loading.style('display', 'block');
        var thisObj = this;
        var input = event.target;
        var reader = new FileReader();
        reader.onload = function () {
            thisObj.mafParser(reader.result);
        };
        reader.readAsText(input.files[0]);
    },
    mafParser: function (text) {
        var thisObj = this;
        var lines = text.split('\n').filter(function (line) {
            return line.trim() != "";
        });
        thisObj.DATA.maf = lines;
        // check out format
        if (lines.shift().indexOf('maf') == -1) {
            alert('Please use MAF 1.0 format.');
            return;
        }
        /*
         bands = chrs.map(function (item) {
         //chrom,chromStart,chromEnd,name,gieStain
         var chromEnd = item[4] != "+" ? parseFloat(item[2]) + parseFloat(item[3]) : parseFloat(item[2]) - parseFloat(item[3])
         return {
         block_id: item[1],
         start: parseFloat(item[2]),
         end: chromEnd,
         name: item[1],
         gieStain: item[6].length
         }
         });
         {"score": 5656.000000,
         "source": "danRer10", "s_chr": 1, "s_start": 120105, "s_op": "+", "s_opr": 173, "s_total": 58871917,
         "target": "hg38", "t_chr": 13, "t_start": 113110682, "t_op": "+", "t_opr": 170, "t_total": 114364328},
         */
        var ribbons = [];
        var item = {
            "score": null,
            "source": null, "s_chr": null, "s_start": null, "s_op": null, "s_opr": null, "s_total": null,
            "target": null, "t_chr": null, "t_start": null, "t_op": null, "t_opr": null, "t_total": null
        };
        lines.forEach(function (line) {
            if (line.search(/^a/) != -1) {
                if (item.source != null && item.target != null) ribbons.push(item);
                item = {
                    "score": parseInt(line.match(/score=(.+)/)[1]),
                    "source": null, "s_chr": null, "s_start": null, "s_op": null, "s_opr": null, "s_total": null,
                    "target": null, "t_chr": null, "t_start": null, "t_op": null, "t_opr": null, "t_total": null
                };
                return;
            }
            if (line.search(/^s/) != -1) {
                var d = line.split(' ').filter(function (item) {
                    return item.trim() != "";
                });
                if (item.source == null) {
                    item.source = d[1].split('.')[0];
                    item.s_chr = d[1].split('.')[1];
                    item.s_start = parseInt(d[2]);
                    item.s_opr = parseInt(d[3]);
                    item.s_op = d[4];
                    item.s_total = parseInt(d[5]);
                    return;
                }
                if (item.target == null) {
                    item.target = d[1].split('.')[0];
                    item.t_chr = d[1].split('.')[1];
                    item.t_start = parseInt(d[2]);
                    item.t_opr = parseInt(d[3]);
                    item.t_op = d[4];
                    item.t_total = parseInt(d[5]);
                }
            }
        });
        thisObj.DATA.ribbons = ribbons;
        var source = _.uniqWith(ribbons, function (a, b) {
            return (a.source == b.source) && (a.s_chr == b.s_chr)
        }).sort(function (a, b) {
            var chr_a = a.s_chr.slice(3);
            var chr_b = b.s_chr.slice(3);
            var pa = parseInt(chr_a);
            var pb = parseInt(chr_b);
            if (typeof pa === 'number' && typeof pb === 'number') {
                return pa - pb;
            }
            if (typeof pa === 'string' && typeof pb === 'number') {
                return 1;
            }
            if (typeof pb === 'string' && typeof pa === 'number') {
                return -1;
            }
            return chr_a.localeCompare(chr_b);

        }).map(function (o, i) {
            return {name: o.source, chr: o.s_chr, len: o.s_total, idx: i};
        });
        var target = _.uniqWith(ribbons, function (a, b) {
            return (a.target == b.target) && (a.t_chr == b.t_chr)
        }).sort(function (a, b) {
            var chr_a = a.t_chr.slice(3);
            var chr_b = b.t_chr.slice(3);
            var pa = parseInt(chr_a);
            var pb = parseInt(chr_b);
            if (typeof pa === 'number' && typeof pb === 'number') {
                return pa - pb;
            }
            if (typeof pa === 'string' && typeof pb === 'number') {
                return 1;
            }
            if (typeof pb === 'string' && typeof pa === 'number') {
                return -1;
            }
            return chr_a.localeCompare(chr_b);
        }).map(function (o, i) {
            return {name: o.target, chr: o.t_chr, len: o.t_total, idx: i};
        });
        var arcs = source.concat(target);
        // sum calculation
        var sum = 0;
        _.forEach(arcs, function (d, i) {
            d.prev_sum = sum;
            sum += d.len;
        });
        thisObj.DATA.sum = sum;
        thisObj.DATA.arcs = arcs;
        thisObj.DATA.len_source = source.length;
        thisObj.DATA.len_target = target.length;

        var scores = ribbons.map(function (o) {
            return o.score;
        });

        //setup slider
        thisObj.DATA.max = _.max(scores);
        thisObj.DATA.min = _.min(scores);
        slider.slider('destroy');
        slider = $("#score").slider({
            tooltip_position: 'bottom',
            min: thisObj.DATA.min,
            max: thisObj.DATA.max,
            value: [thisObj.DATA.min, thisObj.DATA.max],
            tooltip: 'always',
            handle: 'triangle',
            step:1
        });
        $('span.min-score').text(thisObj.DATA.min);
        $('span.max-score').text(thisObj.DATA.max);

        circos.init();
        circos.makeArcs(mafParser.DATA.arcs, mafParser.DATA.sum);
        return [arcs, ribbons];
    }
};
