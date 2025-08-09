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
    <Card className="w-full shadow-lg border-0 bg-white">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Your Profile' : 'My Profile'}
        </CardTitle>
        {!isEditing && <CardDescription className="text-gray-600 mt-2">Manage your personal information and preferences</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white shadow-lg ring-4 ring-blue-100">
              <AvatarImage src={avatarSrc} alt={user.name || 'User'} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl">
                <UserIcon className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            {!isEditing && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <Button variant="outline" onClick={triggerAvatarUpload} className="text-sm bg-white hover:bg-gray-50">
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
          <div className="space-y-6">
            {/* Main Profile Info */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">{user.name || 'Welcome!'}</h2>
              <p className="text-lg text-gray-600">{user.email}</p>
              {user.username && (
                <p className="text-md text-gray-500">@{user.username}</p>
              )}
            </div>

            {/* Profile Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.verified ? 'Verified' : 'Pending'}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(user.created).getFullYear()}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium capitalize">{user.role || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Visibility:</span>
                  <span className="font-medium">{user.emailVisibility ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{new Date(user.updated).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verification:</span>
                  <span className={`font-medium ${user.verified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
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
      <CardFooter className="flex justify-end space-x-3 p-6 bg-gray-50 border-t">
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
          <Button onClick={handleEdit} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6">
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProfileDisplayEdit;
