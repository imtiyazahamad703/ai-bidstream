import os
import glob

test_dir = "src/test/java/com/bidstream"
for filepath in glob.glob(f"{test_dir}/**/*.java", recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "@Disabled" in content:
        content = content.replace("import org.junit.jupiter.api.Disabled;\n", "")
        content = content.replace("@Disabled\n", "")
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Enabled tests in {filepath}")
