function importModel(filePath) {
    try {
        var fileObj = new File(filePath);

        if (!fileObj.exists) {
            return "Error: File Object reports 'does not exist': " + filePath;
        }

        // Check if file is readable
        if (!fileObj.open("r")) {
            return "Error: Could not open file for reading (permissions?): " + filePath;
        }
        fileObj.close();

        var importOptions = new ImportOptions(fileObj);

        // Attempt to import
        var importedItem = app.project.importFile(importOptions);

        if (!importedItem) {
            return "Error: Import returned null. File format might be unsupported or corrupt.";
        }

        // Add to active composition
        var comp = app.project.activeItem;
        if ((comp == null) || !(comp instanceof CompItem)) {
            comp = app.project.items.addComp("Hunyuan 3D Output", 1920, 1080, 1, 10, 30);
        }

        // Add to comp
        var layer = comp.layers.add(importedItem);

        return "Success: Imported " + importedItem.name;
    } catch (e) {
        return "Critical Error during import: " + e.toString();
    }
}
