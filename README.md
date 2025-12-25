# Hunyuan 3D Generator for After Effects

A powerful Adobe After Effects extension that allows you to generate high-quality 3D models from single images directly within your workflow. Powered by the [Hunyuan3D-2.1](https://replicate.com/ndreca/hunyuan3d-2.1) model on Replicate.

![Preview](https://github.com/ilanlenzner-design/Hunyuan-3D-Generator/assets/placeholder-image-url) 
*(Note: You can add a screenshot of your extension here)*

## ✨ Features

*   **Image to 3D**: detailed 3D models from a single reference image.
*   **Interactive Preview**: View, rotate, and quality-check your 3D model in a built-in viewer before importing.
*   **Seamless Import**: Automatically repackages and imports generated `.glb` models directly into your active After Effects composition.
*   **Full Control**: excessive control over generation parameters:
    *   Steps & Guidance Scale
    *   Octree Resolution
    *   Texture Generation
    *   Background Removal
    *   Advanced Seed & Mesh simplification controls
*   **Secure**: Your API Key is stored locally on your machine.

## 🛠️ Installation

1.  **Download the Extension files**.
2.  **Move to Extensions Folder**:
    *   **Mac**: `/Library/Application Support/Adobe/CEP/extensions/hunyuan3d_ae_extension`
    *   **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\hunyuan3d_ae_extension`
3.  **Enable Debug Mode** (Required for unsigned extensions):
    *   **Mac**: Open Terminal and run:
        ```bash
        defaults write com.adobe.CSXS.11 PlayerDebugMode 1
        ```
    *   **Windows**: Open Registry Editor (`regedit`), navigate to `HKEY_CURRENT_USER/Software/Adobe/CSXS.11`, and add a String value named `PlayerDebugMode` with data `1`.
4.  **Restart After Effects**.

## 🚀 Usage

1.  Open After Effects and navigate to **Window > Extensions > Hunyuan 3D**.
2.  Click the **Gear Icon (⚙️)** in the top right and enter your [Replicate API Key](https://replicate.com/account/api-tokens).
3.  **Drag & Drop** an image into the upload zone.
4.  Adjust settings if needed (Default settings usually work great).
5.  Click **Generate 3D Model**.
6.  Wait for generation to finish. You will see a 3D preview of your model.
7.  Click **Import to After Effects** to bring it into your timeline.

## 🔧 Requirements

*   Adobe After Effects 2022 or higher.
*   An active [Replicate](https://replicate.com) account with an API Key.
*   Internet connection (for API communication).

## 📄 License

This project is open source. Feel free to modify and use it for your projects.
