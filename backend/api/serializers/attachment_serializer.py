from rest_framework import serializers
import os

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"}

class AttachmentUploadSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        allow_empty=False
    )

    def validate_files(self, files):
        if not files:
            raise serializers.ValidationError("Please select at least one file.")

        for f in files:
            ext = os.path.splitext(f.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise serializers.ValidationError(
                    f"{f.name} has invalid file format. Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG."
                )

        return files