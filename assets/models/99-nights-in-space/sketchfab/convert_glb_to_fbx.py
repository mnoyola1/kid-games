"""
Blender script to convert GLB to FBX for Mixamo use.
Run with: blender --background --python convert_glb_to_fbx.py
"""
import bpy
import sys
import os

# Blender clears argv; use fixed paths relative to script
script_dir = os.path.dirname(os.path.abspath(__file__))
glb_path = os.path.join(script_dir, "astronaut-extracted", "source", "sample.glb")
fbx_path = os.path.join(script_dir, "astronaut.fbx")

def main():
    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import GLB
    if not os.path.exists(glb_path):
        print("ERROR: GLB not found:", glb_path)
        sys.exit(1)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Select all and apply scale/rotation for Mixamo compatibility
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    
    # Export as FBX - Mixamo-friendly settings
    # Mixamo uses Y-up, -Z forward
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=False,
        global_scale=1.0,
        apply_unit_scale=True,
        axis_forward='-Z',
        axis_up='Y',
        bake_anim=False,
        path_mode='AUTO'
    )
    
    print("Exported FBX:", fbx_path)

if __name__ == "__main__":
    main()
