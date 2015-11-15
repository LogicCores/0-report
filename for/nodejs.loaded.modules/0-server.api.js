
exports.forLib = function (LIB) {

    var exports = {};

    exports.generateForModule = function (module) {

        var report = {
            modules: {},
            directories: {},
            summary: {
                byDirectorySize: []
            }
        };

        function traverse (module, parentModule) {

            return LIB.fs.statAsync(module.id).then(function (stat) {

                report.modules[module.id] = {
                    size: stat.size
                };
                if (parentModule) {
                    report.modules[module.id].parent = parentModule.id;
                }
                
                var parts = LIB.path.dirname(module.id).split("/");
                var path;
                for (var i=2 ; i<parts.length ; i++) {
                    path = parts.slice(0, i).join("/");
                    if (!report.directories[path]) {
                        report.directories[path] = 0;
                    }
                    report.directories[path] += stat.size;
                }

                if (!module.children) {
                    return;
                }

                return LIB.Promise.all(module.children.map(function (child) {
                    return traverse(child, module);
                }));
            });
        }

        return traverse(module).then(function () {

            Object.keys(report.directories).forEach(function (path) {
                report.summary.byDirectorySize.push([
                    report.directories[path], path
                ]);
            });
            report.summary.byDirectorySize = LIB._.sortBy(report.summary.byDirectorySize, function (item) {
                return item[0] * 100 - item[1].split("/").length;
            });
            report.summary.byDirectorySize.reverse();

            return report;
        });
    }

    return exports;
}
