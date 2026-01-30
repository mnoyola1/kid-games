import sys
import os
import bpy


def parse_args():
    args = sys.argv
    if "--" not in args:
        raise SystemExit("Usage: blender -b -P convert_fbx_to_glb.py -- <input.fbx> <output.glb>")
    idx = args.index("--") + 1
    if len(args) < idx + 2:
        raise SystemExit("Missing input/output arguments.")
    return args[idx], args[idx + 1]


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.armatures:
        bpy.data.armatures.remove(block)


def main():
    input_path, output_path = parse_args()
    input_path = os.path.abspath(input_path)
    output_path = os.path.abspath(output_path)

    if not os.path.isfile(input_path):
        raise SystemExit(f"Input file not found: {input_path}")

    clean_scene()

    bpy.ops.import_scene.fbx(filepath=input_path)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        export_yup=True,
        export_apply=True
    )

    print(f"Converted {input_path} -> {output_path}")


if __name__ == "__main__":
    main()
