"use client";

import React, { useState, useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Pencil, Save, XCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ProfileDisplayEdit = ({ user }) => {
  const { setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const getAvatarUrl = (record, avatarFilename) => {
    if (record && avatarFilename) {
      return pb.getFileUrl(record, avatarFilename);
    }
    return '/Images/default_user.jpg'; // Fallback to a default image in public/Images
  };

  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name || '');
      setAvatarPreview(getAvatarUrl(user, user.avatar));
    }
  }, [user, isEditing]);

  const handleNameChange = (e) => setName(e.target.value);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setName(user.name || '');
    setAvatarPreview(getAvatarUrl(user, user.avatar));
    setAvatarFile(null); // Clear previous file selection
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    // Reset preview to current user avatar, not necessarily the initial one if it was changed then cancelled
    setAvatarPreview(getAvatarUrl(user, user.avatar));
    setName(user.name || ''); // Reset name to current user name
  };

  const handleSave = async () => {
    setIsLoading(true);
    toast.info('Attempting to save profile...');

    const data = new FormData();
    data.append('name', name);

    if (avatarFile) {
      data.append('avatar', avatarFile);
    }
    // To remove avatar, you might need a specific API call or send an empty value
    // For now, if no new avatarFile, the existing avatar remains.

    try {
      const updatedRecord = await pb.collection('users').update(user.id, data);
      setUser(updatedRecord); // Update user in AuthContext
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null); // Clear the file input after successful upload
      setAvatarPreview(getAvatarUrl(updatedRecord, updatedRecord.avatar)); // Update preview with new avatar
    } catch (error) {
      console.error("Failed to update profile:", error);
      let errorMessage = 'Failed to update profile.';
      if (error.data && error.data.data) {
        const fieldErrors = Object.values(error.data.data).map(err => err.message).join(' ');
        if (fieldErrors) errorMessage += ` ${fieldErrors}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const avatarSrc = avatarPreview || getAvatarUrl(user, user.avatar);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-gray-700">
          {isEditing ? 'Edit Your Profile' : 'Profile Details'}
        </CardTitle>
        {!isEditing && <CardDescription>View or update your personal information.</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32 border-4 border-gray-200 shadow-md">
            <AvatarImage src={avatarSrc} alt={user.name || 'User'} />
            <AvatarFallback className="bg-gray-300">
              <UserIcon className="w-16 h-16 text-gray-500" />
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <>
              <Button variant="outline" onClick={triggerAvatarUpload} className="text-sm">
                Change Avatar
              </Button>
              <Input
                id="avatar"
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
            </>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-4 text-center">
            <div>
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-500">Name</Label>
              <p id="displayName" className="text-xl font-semibold text-gray-800">{user.name || 'Not set'}</p>
            </div>
            <div>
              <Label htmlFor="displayEmail" className="text-sm font-medium text-gray-500">Email</Label>
              <p id="displayEmail" className="text-lg text-gray-700">{user.email}</p>
            </div>
             {user.username && (
                <div>
                    <Label htmlFor="displayUsername" className="text-sm font-medium text-gray-500">Username</Label>
                    <p id="displayUsername" className="text-lg text-gray-700">{user.username}</p>
                </div>
            )}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Your full name"
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="email_display" className="block text-sm font-medium text-gray-700 mb-1">Email (cannot be changed)</Label>
              <Input
                id="email_display"
                type="email"
                value={user.email}
                disabled
                className="w-full bg-gray-100"
              />
            </div>
             {user.username && (
                 <div>
                    <Label htmlFor="username_display" className="block text-sm font-medium text-gray-700 mb-1">Username (cannot be changed)</Label>
                    <Input
                        id="username_display"
                        type="text"
                        value={user.username}
                        disabled
                        className="w-full bg-gray-100"
                    />
                </div>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-3 p-6 bg-gray-50">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex items-center">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !name} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={handleEdit} className="flex items-center bg-gray-700 hover:bg-gray-800 text-white">
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProfileDisplayEdit;
