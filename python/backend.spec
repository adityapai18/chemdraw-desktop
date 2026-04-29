# PyInstaller spec for packaging the Python backend into a single .exe
# Run: pyinstaller backend.spec

block_cipher = None

a = Analysis(
    ['backend.py'],
    pathex=['.'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'win32com', 'win32com.client', 'win32api', 'win32con',
        'pywintypes', 'pythoncom',
        'rdkit', 'rdkit.Chem', 'rdkit.Chem.Descriptors', 'rdkit.Chem.rdMolDescriptors',
        'pandas', 'openpyxl', 'requests', 'periodictable',
        'xml.etree.ElementTree', 'urllib.parse',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['flask', 'scipy', 'sklearn', 'matplotlib', 'tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend',
)
